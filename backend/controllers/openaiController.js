const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const archiver = require('archiver');
const { callOpenAIWithTimeout, createFormattedParagraphs, generateUniqueFilename } = require('../utils/openaiUtils');

exports.uploadTags = async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }
    // Log file and project name
    console.log('Tag file uploaded:', req.file.originalname, 'for project:', req.body.projectName);
    try {
        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const { projectName } = req.body;
        if (!projectName) {
            return res.status(400).send({ error: 'Project name is required.' });
        }
        const project = await Project.findOne({ projectName });
        if (!project || !project.prompts || project.prompts.length === 0) {
            return res.status(400).send({ error: 'No prompts found for the project. Please upload prompts first.' });
        }
        const numberOfProjects = sheetData.length;
        const filledPromptsWithProjects = sheetData.map((row) => {
            const rowProjectName = row.projectName || 'Unknown Project';
            const filledPrompts = project.prompts.map((prompt) => {
                let filledPrompt = prompt;
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        const placeholder = `<${key}>`;
                        filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), row[key] || '');
                    }
                }
                return filledPrompt;
            });
            return { projectName: rowProjectName, filledPrompts };
        });
        res.status(200).json({ filledPromptsWithProjects, numberOfProjects });
    } catch (error) {
        console.error('❌ Error processing tags file:', error);
        res.status(500).send({ error: 'Failed to process the tags file.' });
    }
};

exports.generateResponses = async (req, res) => {
    const { filledPromptsWithProjects } = req.body;
    if (!filledPromptsWithProjects || !Array.isArray(filledPromptsWithProjects)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }
    try {
        const projectFiles = [];
        for (const project of filledPromptsWithProjects) {
            const { projectName, filledPrompts } = project;
            if (!filledPrompts || !filledPrompts.length) continue;
            const paragraphs = [];
            let index = 1;
            for (const prompt of filledPrompts) {
                try {
                    const aiResponse = await callOpenAIWithTimeout(prompt);
                    const rawResponseText = aiResponse?.choices?.[0]?.message?.content?.trim() || 'No response';
                    paragraphs.push(...createFormattedParagraphs(index, rawResponseText));
                } catch (error) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Prompt: ${index}`, bold: true, color: 'FF0000' }),
                                new TextRun('\n'),
                                new TextRun({ text: 'Response: Failed to generate response.', italic: true }),
                            ],
                        }),
                        new Paragraph({})
                    );
                }
                index++;
            }
            const doc = new Document({
                sections: [
                    { properties: {}, children: paragraphs },
                ],
            });
            const responsesDir = path.join(__dirname, '../Responses');
            if (!fs.existsSync(responsesDir)) {
                fs.mkdirSync(responsesDir);
            }
            const baseFileName = path.join(responsesDir, `${projectName.replace(/\s+/g, '_')}_responses`);
            const uniqueFileName = generateUniqueFilename(baseFileName, '.docx');
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(uniqueFileName, buffer);
            projectFiles.push({ projectName: `${projectName} (${projectFiles.length})`, filePath: path.basename(uniqueFileName) });
        }
        res.json({ projectFiles });
    } catch (error) {
        res.status(500).send({ error: 'Failed to generate responses.' });
    }
};

exports.checkResponses = (req, res) => {
    const folderPath = path.join(__dirname, '../Responses');
    if (!fs.existsSync(folderPath)) {
        return res.json({ hasFiles: false });
    }
    const files = fs.readdirSync(folderPath);
    res.json({ hasFiles: files.length > 0 });
};

exports.downloadAll = (req, res) => {
    const folderPath = path.join(__dirname, '../Responses');
    const zipFileName = 'responses.zip';
    const zipFilePath = path.join(__dirname, zipFileName);
    if (!fs.existsSync(folderPath)) {
        return res.status(404).send({ error: 'Responses folder not found.' });
    }
    res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(folderPath, false);
    archive.finalize();
}; 