const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const openaiController = require('../controllers/openaiController');

router.post('/upload-tags', upload.single('file'), openaiController.uploadTags);
router.post('/generate-responses', openaiController.generateResponses);
router.get('/check-responses', openaiController.checkResponses);
router.get('/download-all', openaiController.downloadAll);

module.exports = router; 