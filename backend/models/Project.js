const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true, unique: true },
    prompts: { type: [String], default: [] },
});

module.exports = mongoose.model('Project', ProjectSchema);
