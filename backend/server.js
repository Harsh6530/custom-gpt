const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const { OpenAI } = require('openai');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const app = express();
const PORT = 5000;

// Load environment variables from .env file
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

let prompts = []; // Store uploaded prompts
let filledPromptsWithProjects = [];

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Route to upload Excel file and extract prompts
app.post('/api/upload-prompts', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        prompts = sheetData.map(row => row.Prompt);

        res.json({ prompts });
    } catch (error) {
        console.error('Error processing prompt file:', error);
        res.status(500).send({ error: 'Failed to process the prompt file.' });
    }
});

// Route to upload tags and replace placeholders in the prompts
app.post('/api/upload-tags', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (prompts.length === 0) {
            return res.status(400).send({ error: 'No prompts uploaded. Please upload the prompt file first.' });
        }

        filledPromptsWithProjects = sheetData.map(row => {
            const projectName = row.projectName || 'Unknown Project';
            const filledPrompts = prompts.map(prompt => {
                let filledPrompt = prompt;
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        const placeholder = `<${key}>`;
                        filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), row[key] || '');
                    }
                }
                return filledPrompt;
            });
            return { projectName, filledPrompts };
        });

        res.json({ filledPromptsWithProjects });
    } catch (error) {
        console.error('Error processing tags file:', error);
        res.status(500).send({ error: 'Failed to process the tags file.' });
    }
});



const callOpenAIWithTimeout = async (prompt, timeout = 15000) => {
    return Promise.race([
        openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('OpenAI request timed out')), timeout)
        ),
    ]);
};

app.post('/api/generate-responses', async (req, res) => {
    console.log('API request received');
    const { filledPromptsWithProjects } = req.body;

    if (!filledPromptsWithProjects || !Array.isArray(filledPromptsWithProjects)) {
        console.log('Invalid input received');
        return res.status(400).send({ error: 'Invalid input.' });
    }

    try {
        console.log('Processing projects...');
        console.log('Filled Prompts with Projects:', JSON.stringify(filledPromptsWithProjects, null, 2));

        const projectFiles = [];

        for (const project of filledPromptsWithProjects) {
            const { projectName, filledPrompts } = project;

            console.log(`Processing project: ${projectName}`);
            console.log(`Prompts: ${JSON.stringify(filledPrompts)}`);

            if (!filledPrompts || !filledPrompts.length) continue;

            const paragraphs = [];

            for (const prompt of filledPrompts) {
                try {
                    console.log(`Sending prompt to OpenAI: ${prompt} at ${new Date().toISOString()}`);

                    const aiResponse = await callOpenAIWithTimeout(prompt);

                    const responseText =
                        aiResponse?.choices?.[0]?.message?.content?.trim() || 'No response';

                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Prompt: ${prompt}`, bold: true }),
                                new TextRun('\n'),
                                new TextRun({ text: `Response: ${responseText}` }),
                            ],
                        })
                    );
                } catch (error) {
                    console.error(`Error generating response for prompt "${prompt}":`, error.message);
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Prompt: ${prompt}`, bold: true }),
                                new TextRun('\n'),
                                new TextRun({ text: 'Response: Failed to generate response.', italic: true }),
                            ],
                        })
                    );
                }
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: paragraphs,
                    },
                ],
            });

            const filePath = `./${projectName.replace(/\s+/g, '_')}_responses.docx`;
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            console.log(`Word file generated: ${filePath}`);

            projectFiles.push({ projectName, filePath });
        }

        res.json({ projectFiles });
    } catch (error) {
        console.error('Error in /generate-responses:', error.message);
        res.status(500).send({ error: 'Failed to generate responses.' });
    }
});



// Route to download Word file
app.get('/api/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `./${fileName}`;

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
            fs.unlinkSync(filePath); // Delete the file after download
        });
    } else {
        res.status(404).send({ error: 'File not found.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
