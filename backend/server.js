const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();
const port = 5000;
require('dotenv').config();

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenAI API key
});

app.use(cors());
app.use(express.json());


// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

let prompts = [];
let tagMappings = [];

// Endpoint to upload prompts file
app.post('/upload-prompts', upload.single('file'), (req, res) => {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    prompts = data;
    res.status(200).json({ message: 'Prompts uploaded successfully', prompts });
});

// Endpoint to upload tags file
app.post('/upload-tags', upload.single('file'), async (req, res) => {
  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const tagData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  tagMappings = tagData;

  const groupedPrompts = tagMappings.reduce((result, tag) => {
      const projectName = tag.projectName;
      if (!result[projectName]) result[projectName] = [];
      prompts.forEach((promptObj) => {
          let parsedPrompt = promptObj.Prompt;
          Object.keys(tag).forEach((key) => {
              const placeholder = `<${key}>`;
              if (parsedPrompt.includes(placeholder)) {
                  parsedPrompt = parsedPrompt.replace(new RegExp(placeholder, "g"), tag[key]);
              }
          });
          result[projectName].push({ ...promptObj, parsedPrompt });
      });
      return result;
  }, {});

  const parsedProjects = Object.entries(groupedPrompts).map(([projectName, parsedPrompts]) => ({
      projectName,
      parsedPrompts,
  }));

  console.log("Parsed Projects:", parsedProjects); // Debugging
  res.status(200).json({ message: 'Tags uploaded successfully', parsedProjects });
});




// Endpoint to get responses from OpenAI
app.post('/generate-responses', async (req, res) => {
    try {
        const { prompts } = req.body; // Array of parsed prompts
        const responses = await Promise.all(
            prompts.map(async (prompt) => {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo', // Replace with your desired model
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 200,
                });
                return { prompt, response: completion.choices[0].message.content };
            })
        );

        res.status(200).json({ responses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating responses' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
