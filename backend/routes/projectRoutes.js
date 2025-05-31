const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const projectController = require('../controllers/projectController');

router.post('/upload-prompts', upload.single('file'), projectController.uploadPrompts);
router.get('/fetch-prompts/:projectName', projectController.fetchPrompts);
router.get('/projects', projectController.getProjects);
router.post('/projects', projectController.createProject);
router.delete('/projects/:id', projectController.deleteProject);
router.delete('/delete-responses', projectController.deleteResponses);

module.exports = router; 