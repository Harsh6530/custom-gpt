const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

exports.uploadPrompts = async (req, res) => {
    if (!req.file || !req.body.projectName) {
        return res.status(400).send({ error: 'Project name or file is missing.' });
    }
    try {
        const { projectName } = req.body;
        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const newPrompts = sheetData.map((row) => row.Prompt).filter(Boolean);
        if (newPrompts.length === 0) {
            return res.status(400).json({ error: 'No prompts found in the uploaded file.' });
        }
        let project = await Project.findOne({ projectName });
        if (project) {
            project.prompts = newPrompts;
        } else {
            project = new Project({ projectName, prompts: newPrompts });
        }
        await project.save();
        res.status(200).json({ message: 'Prompts uploaded and overwritten successfully.', prompts: project.prompts });
    } catch (error) {
        console.error('Error processing prompt file:', error);
        res.status(500).send({ error: 'Failed to process the prompt file.' });
    }
};

exports.fetchPrompts = async (req, res) => {
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
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send({ error: 'Failed to fetch projects.' });
    }
};

exports.createProject = async (req, res) => {
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
};

exports.deleteProject = async (req, res) => {
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
};

exports.deleteResponses = (req, res) => {
    const responsesDir = path.join(__dirname, '../Responses');
    if (fs.existsSync(responsesDir)) {
        fs.readdir(responsesDir, (err, files) => {
            if (err) {
                console.error('Error reading Responses directory:', err);
                return res.status(500).send({ error: 'Failed to read Responses directory.' });
            }
            files.forEach((file) => {
                const filePath = path.join(responsesDir, file);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Failed to delete file ${file}:`, unlinkErr);
                    }
                });
            });
            res.status(200).send({ message: 'All responses deleted successfully.' });
        });
    } else {
        res.status(404).send({ error: 'Responses directory not found.' });
    }
}; 