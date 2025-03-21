const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const app = express();
const PORT = 5000;
const Project = require('./models/Project');
const User = require('./models/User')
const APISettings = require("./models/APIsettings");



// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// let prompts = []; // Store uploaded prompts
// let filledPromptsWithProjects = [];
mongoose
    .connect('mongodb+srv://sharmaharsh634:rajesh530@cluster0.jtsxc.mongodb.net/project_name_prompts?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));

// mongoose
//     .connect('mongodb+srv://sharmaharsh634:rajesh530@cluster0.jtsxc.mongodb.net/project_name_prompts?retryWrites=true&w=majority&appName=Cluster0')
//     .then(() => console.log('Connected to project_name_prompts'))
//     .catch(error => console.error('Error connecting to MongoDB:', error));


// OpenAI Configuration
// Admin credentials

// Endpoint to fetch all users
// app.get('/api/users', async (req, res) => {
//     try {
//         const users = await User.find({}, { email: 1, _id: 0 }); // Only fetch email
//         res.json(users);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error');
//     }
// });

// Endpoint to send credentials via email

app.post('/api/send-credentials', async (req, res) => {
    const { type, userId, password } = req.body;
    console.log(req.body);

    // Validate the required fields
    if (!userId || !password || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Save the user credentials to the database
        const newUser = new User({
            type: type,
            email: userId, // Assuming `email` is the field in your User model
            password, // Save the password securely (hash it in production)
        });

        await newUser.save(); // Save to the MongoDB collection

        console.log('User credentials saved to the database');

        // Nodemailer setup
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'gptcustom63@gmail.com', // Your email
                pass: 'xygn rtkv ezkq pzzy', // Your email app password
            },
            logger: true,
            debug: true,
        });

        const mailOptions = {
            from: 'gptcustom63@gmail.com', // Sender email
            to: userId, // Recipient email
            type: type,
            subject: 'Your Login Credentials',
            text: `Hello,\n\nHere are your login credentials:\nType: ${type}\nUser ID: ${userId}\nPassword: ${password}\n\nThank you,\nCustom GPT Team`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Respond with success
        res.status(200).json({ message: 'Email sent and user saved successfully' });
    } catch (error) {
        console.error('Error:', error);

        if (error.response) {
            console.error('Nodemailer Response:', error.response);
        }

        res.status(500).json({ message: 'Failed to send email or save user' });
    }
});


// Endpoint to verify admin login
app.post('/api/login', async (req, res) => {
    const { email, password, userType } = req.body;
    console.log(req.body);

    const type = userType.toLowerCase();

    if (!email || !password || !userType) {
        return res.status(400).json({ message: 'Email, password, and user type are required' });
    }

    try {
        // Find the user with the specified email, password, and userType
        const user = await User.findOne({ email, password, type });

        if (user) {
            return res.status(200).json({ message: 'Login successful', type });
        } else {
            return res.status(401).json({ message: 'Invalid credentials or user type' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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
            console.log('Overwriting prompts...');

            // ✅ Overwrite prompts instead of appending
            project.prompts = newPrompts;
        } else {
            // ✅ Create a new project if it doesn't exist
            console.log('Creating a new project...');
            project = new Project({ projectName, prompts: newPrompts });
        }

        // Save the project to the database (either updated or new)
        await project.save();
        console.log('Project saved successfully with new prompts.');

        res.status(200).json({
            message: 'Prompts uploaded and overwritten successfully.',
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

        // Count the number of projects (rows) in the uploaded file
        const numberOfProjects = sheetData.length;

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

        res.status(200).json({ 
            filledPromptsWithProjects, 
            numberOfProjects  // ✅ Include the number of rows (projects)
        });

        console.log('✅ API request received');
        console.log('📂 Uploaded file:', req.file);
        console.log('📌 Project Name from Request:', projectName);
        console.log('📊 Number of Projects (Rows):', numberOfProjects);
        console.log('📝 Filled Prompts with Projects:', filledPromptsWithProjects);
        
    } catch (error) {
        console.error('❌ Error processing tags file:', error);
        res.status(500).send({ error: 'Failed to process the tags file.' });
    }
});



// Function to clean and format the OpenAI response
const cleanAndFormatResponse = (responseText) => {
    if (!responseText) return 'No response';

    // Remove unnecessary markdown characters
    let cleanedText = responseText
        .replace(/[#*_-]/g, '') // Remove hashtags, asterisks, underscores, and dashes
        .replace(/\s*\n\s*\n/g, '\n') // Normalize empty lines
        .replace(/•/g, '-'); // Replace bullet points with dashes for uniformity

    // Add a newline before numbered points (e.g., 1., 2., 3.)
    cleanedText = cleanedText.replace(/(\d+\.)\s*/g, '\n$1 ');

    // Add a newline before sub-points after colons (:)
    cleanedText = cleanedText.replace(/:\s*/g, ':\n');

    // Trim lines and ensure proper spacing
    cleanedText = cleanedText
        .split('\n')
        .map((line) => line.trim()) // Trim each line
        .filter((line) => line.length > 0) // Remove empty lines
        .join('\n'); // Rejoin the lines

    return cleanedText;
};

// Function to create paragraphs from the cleaned response
const createFormattedParagraphs = (prompt, response) => {
    const cleanedResponse = cleanAndFormatResponse(response);
    const paragraphs = [];

    // Add the prompt as the first paragraph, bold and red
    paragraphs.push(
        new Paragraph({}), // Add an empty paragraph for spacing before the prompt
        new Paragraph({
            children: [new TextRun({ text: `Prompt: ${prompt}`, bold: true, color: 'FF0000' })],
        }),
        new Paragraph({}) // Add an empty paragraph for spacing before the response
    );

    // Process each line in the cleaned response
    const lines = cleanedResponse.split('\n');
    lines.forEach((line) => {
        if (/^\d+\./.test(line) || line.endsWith(':')) {
            // Add a blank line (empty paragraph) before the header
            paragraphs.push(new Paragraph({})); // Blank line before headers

            // Add the header with bold text
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: line, bold: true })],
                })
            );
        } else {
            // Regular text
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: line })],
                })
            );
        }
    });

    return paragraphs;
};

// Function to call OpenAI with a timeout
const callOpenAIWithTimeout = async (prompt, timeout = 90000) => {
    const response = await axios.get("http://3.86.52.25:5000/api/get-api-settings");
    
    const apiKey = response.data.apiKey;
    const model = response.data.model;

    const openai = new OpenAI({ apiKey });

    return Promise.race([
        openai.chat.completions.create({
            model: model, // ✅ Use stored model
            messages: [
                { role: "system", content: "Provide a detailed response to the prompt and try to consume the full token limit. Generate around 2000 words" },
                { role: "user", content: prompt }
            ],
            max_tokens: 2700,
            temperature: 0.8,
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("OpenAI request timed out")), timeout)
        ),
    ]);
};



// Function to generate a unique file name
const generateUniqueFilename = (baseName, extension) => {
    let counter = 0;
    let filename = `${baseName}${extension}`;
    while (fs.existsSync(filename)) {
        counter++;
        filename = `${baseName}(${counter})${extension}`;
    }
    return filename;
};

// Route to generate responses
app.post('/api/generate-responses', async (req, res) => {
    console.log('API request received');
    const { filledPromptsWithProjects } = req.body;

    if (!filledPromptsWithProjects || !Array.isArray(filledPromptsWithProjects)) {
        console.log('Invalid input received');
        return res.status(400).send({ error: 'Invalid input.' });
    }

    try {
        console.log('Processing projects...');
        const projectFiles = [];

        for (const project of filledPromptsWithProjects) {
            const { projectName, filledPrompts } = project;

            console.log(`Processing project: ${projectName}`);

            if (!filledPrompts || !filledPrompts.length) continue;

            const paragraphs = [];
            let index = 1;

            for (const prompt of filledPrompts) {
                try {
                    console.log(`Sending prompt to OpenAI: ${prompt} at ${new Date().toISOString()}`);

                    const aiResponse = await callOpenAIWithTimeout(prompt);

                    const rawResponseText =
                        aiResponse?.choices?.[0]?.message?.content?.trim() || 'No response';

                    // Add formatted paragraphs
                    paragraphs.push(...createFormattedParagraphs(index, rawResponseText));
                } catch (error) {
                    console.error(`Error generating response for prompt "${index}":`, error.message);
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Prompt: ${index}`, bold: true, color: 'FF0000' }),
                                new TextRun('\n'),
                                new TextRun({ text: 'Response: Failed to generate response.', italic: true }),
                            ],
                        }),
                        new Paragraph({}) // Add an empty paragraph for spacing
                    );
                }
                index++;
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: paragraphs,
                    },
                ],
            });
            const responsesDir = path.join(__dirname, 'Responses');
            if (!fs.existsSync(responsesDir)) {
                fs.mkdirSync(responsesDir); // Create the directory if it doesn't exist
            }

            const baseFileName = path.join(responsesDir, `${projectName.replace(/\s+/g, '_')}_responses`);
            const uniqueFileName = generateUniqueFilename(baseFileName, '.docx');
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(uniqueFileName, buffer);

            console.log(`Word file generated: ${uniqueFileName}`);

            projectFiles.push({ projectName: `${projectName} (${projectFiles.length})`, filePath: path.basename(uniqueFileName) });
        }

        res.json({ projectFiles });
    } catch (error) {
        console.error('Error in /generate-responses:', error.message);
        res.status(500).send({ error: 'Failed to generate responses.' });
    }
});

// Route to check if responses exist
app.get('/api/check-responses', (req, res) => {
    const folderPath = path.join(__dirname, 'Responses');

    console.log("✅ Checking Responses folder...");

    if (!fs.existsSync(folderPath)) {
        console.log("❌ Folder does not exist.");
        return res.json({ hasFiles: false });
    }

    const files = fs.readdirSync(folderPath);
    console.log(`✅ Files found: ${files.length}`);
    console.log(`📂 File list:`, files);

    res.json({ hasFiles: files.length > 0 });
});

// Route to download Word file
app.get('/api/download-all', (req, res) => {
    const folderPath = path.join(__dirname, 'Responses'); // Directory to zip
    const zipFileName = 'responses.zip';
    const zipFilePath = path.join(__dirname, zipFileName);

    // Check if the folder exists
    if (!fs.existsSync(folderPath)) {
        return res.status(404).send({ error: 'Responses folder not found.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Append entire folder contents to ZIP
    archive.directory(folderPath, false);

    archive.finalize();
});

app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Internal server error' });
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

// Route to delete all files in the Responses directory
app.delete('/api/delete-responses', (req, res) => {
    const responsesDir = path.join(__dirname, 'Responses');

    // Check if the Responses directory exists
    if (fs.existsSync(responsesDir)) {
        fs.readdir(responsesDir, (err, files) => {
            if (err) {
                console.error('Error reading Responses directory:', err);
                return res.status(500).send({ error: 'Failed to read Responses directory.' });
            }

            // Loop through and delete each file in the Responses directory
            files.forEach((file) => {
                const filePath = path.join(responsesDir, file);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Failed to delete file ${file}:`, unlinkErr);
                    }
                });
            });

            // Send a success response after files are deleted
            res.status(200).send({ message: 'All responses deleted successfully.' });
        });
    } else {
        res.status(404).send({ error: 'Responses directory not found.' });
    }
});


// ✅ Fetch all users
app.get('/api/get-users', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from MongoDB
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
    }
});


// ✅ Update user details
app.put('/api/update-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body);
        const { email, password, type } = req.body;
        const updatedUser = await User.findByIdAndUpdate(id, { email, password, type }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// ✅ Delete user
app.delete('/api/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

// ✅ Get API Key & Model
app.get("/api/get-api-settings", async (req, res) => {
    try {
        const settings = await APISettings.findOne();
        if (!settings) return res.status(404).json({ error: "API settings not found" });

        res.json({
            apiKey: settings.apiKey,
            model: settings.model
        });
    } catch (error) {
        console.error("Error fetching API settings:", error);
        res.status(500).json({ error: "Failed to fetch API settings" });
    }
});


// ✅ Update API Key & Model (Admin only)
app.post("/api/update-api-settings", async (req, res) => {
    try {
        console.log(req.body);
        const { apiKey, model } = req.body;

        let settings = await APISettings.findOne();

        if (!settings) {
            settings = new APISettings({});
        }

        // ✅ Only update fields that are provided in the request
        if (apiKey) settings.apiKey = apiKey;
        if (model) settings.model = model;

        await settings.save();
        res.json({ success: true, message: "API settings updated successfully", settings });
    } catch (error) {
        console.error("Error updating API settings:", error);
        res.status(500).json({ error: "Failed to update API settings" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
