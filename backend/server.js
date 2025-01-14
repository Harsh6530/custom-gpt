const express = require('express');
const cors = require('cors');
const multer = require('multer'); // For file uploads
const xlsx = require('xlsx'); // For processing Excel files
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

let prompts = []; // Store uploaded prompts

// Route to upload Excel file and extract prompts
app.post('/api/upload-prompts', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    try {
        // Read the uploaded Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Extract prompts from the Excel file
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
        // Read the uploaded Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log('Uploaded Tag Data:', sheetData); // Debugging: Log the tag data

        if (prompts.length === 0) {
            return res.status(400).send({ error: 'No prompts uploaded. Please upload the prompt file first.' });
        }

        // Replace placeholders in the prompts
        const filledPromptsWithProjects = sheetData.map(row => {
            const projectName = row.projectName || 'Unknown Project';
            const filledPrompts = prompts.map(prompt => {
                let filledPrompt = prompt;
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        const placeholder = `<${key}>`; // Match placeholder format
                        filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), row[key] || '');
                    }
                }
                return filledPrompt;
            });
            return { projectName, filledPrompts };
        });

        console.log('Filled Prompts with Projects:', filledPromptsWithProjects); // Debugging: Log the output
        res.json({ filledPromptsWithProjects });
    } catch (error) {
        console.error('Error processing tags file:', error);
        res.status(500).send({ error: 'Failed to process the tags file.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
