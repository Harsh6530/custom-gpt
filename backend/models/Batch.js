const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  prompts: { type: Array, required: true },
  results: { type: Array, default: [] },
  status: { type: String, default: 'Pending' },
});

module.exports = mongoose.model('Batch', batchSchema);
