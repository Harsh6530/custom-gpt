const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const xlsx = require('xlsx');
const { OpenAI } = require('openai');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const app = express();
const PORT = 5000;
const Project = require('./models/Project');

// Load environment variables from .env file
require('dotenv').config();



// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

let prompts = []; // Store uploaded prompts
let filledPromptsWithProjects = [];

mongoose
    .connect('mongodb+srv://sharmaharsh634:rajesh530@cluster0.jtsxc.mongodb.net/project_name_prompts?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));


// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Route to upload Excel file and extract prompts
app.post('/api/upload-prompts', upload.single('file'), async (req, res) => {
    if (!req.file || !req.body.projectName) {
        return res.status(400).send({ error: 'Project name or file is missing.' });
    }

    console.log('API request received');
    console.log('Uploaded file:', req.file);
    console.log('Project Name:', req.body.projectName);

    try {
        const { projectName } = req.body;

        // Read the uploaded file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Extract prompts from the file
        const newPrompts = sheetData.map((row) => row.Prompt).filter(Boolean); // Filter out empty values
        console.log('Extracted Prompts:', newPrompts);

        if (newPrompts.length === 0) {
            return res.status(400).json({ error: 'No prompts found in the uploaded file.' });
        }

        // Check if the project already exists
        let project = await Project.findOne({ projectName });
        if (project) {
            console.log('Project already exists:', project);

            // Filter out prompts that already exist
            const uniquePrompts = newPrompts.filter((prompt) => !project.prompts.includes(prompt));
            console.log('Unique Prompts:', uniquePrompts);

            if (uniquePrompts.length === 0) {
                return res.status(200).json({
                    message: 'All prompts are already uploaded.',
                    prompts: project.prompts,
                });
            }

            // Add unique prompts to the existing project
            project.prompts.push(...uniquePrompts);
        } else {
            // Create a new project
            console.log('Creating a new project...');
            project = new Project({ projectName, prompts: newPrompts });
        }

        // Save the project to the database
        await project.save();
        console.log('Project saved successfully.');

        res.status(200).json({
            message: 'Prompts uploaded successfully.',
            prompts: project.prompts,
        });
    } catch (error) {
        console.error('Error processing prompt file:', error);
        res.status(500).send({ error: 'Failed to process the prompt file.' });
    }
});

app.get('/api/fetch-prompts/:projectName', async (req, res) => {
    const { projectName } = req.params;

    try {
        const project = await Project.findOne({ projectName });

        if (!project) {
            return res.status(404).send({ error: 'Project not found.' });
        }

        res.status(200).json({ prompts: project.prompts });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).send({ error: 'Failed to fetch prompts.' });
    }
});

// Route to upload tags and replace placeholders in the prompts
app.post('/api/upload-tags', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    try {
        // Load the uploaded file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Fetch the projectName from the request body to find prompts in the DB
        const { projectName } = req.body;

        if (!projectName) {
            return res.status(400).send({ error: 'Project name is required.' });
        }

        // Retrieve the project and its prompts from the database
        const project = await Project.findOne({ projectName });

        if (!project || !project.prompts || project.prompts.length === 0) {
            return res.status(400).send({ error: 'No prompts found for the project. Please upload prompts first.' });
        }

        // Map the projectName dynamically from the tag file
        const filledPromptsWithProjects = sheetData.map((row) => {
            const rowProjectName = row.projectName || 'Unknown Project'; // Read projectName dynamically
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
            return { projectName: rowProjectName, filledPrompts }; // Use projectName from the row
        });

        res.status(200).json({ filledPromptsWithProjects });
        console.log('API request received');
        console.log('Uploaded file:', req.file);
        console.log('Project Name from Request:', projectName);
        console.log('Filled Prompts with Projects:', filledPromptsWithProjects);
    } catch (error) {
        console.error('Error processing tags file:', error);
        res.status(500).send({ error: 'Failed to process the tags file.' });
    }
});




const callOpenAIWithTimeout = async (prompt, timeout = 15000) => {
    return Promise.race([
        openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
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



// Routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send({ error: 'Failed to fetch projects.' });
    }
});

app.post('/api/projects', async (req, res) => {
    const { projectName } = req.body;

    if (!projectName) {
        return res.status(400).send({ error: 'Project name is required.' });
    }

    try {
        const newProject = new Project({ projectName });
        await newProject.save();
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).send({ error: 'Failed to save project.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
