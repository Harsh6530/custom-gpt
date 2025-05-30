const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/get-api-settings', settingsController.getApiSettings);
router.post('/update-api-settings', settingsController.updateApiSettings);

module.exports = router; 