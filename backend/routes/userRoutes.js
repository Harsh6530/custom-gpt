const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/send-credentials', userController.sendCredentials);
router.post('/login', userController.login);
router.get('/get-users', userController.getUsers);
router.put('/update-user/:id', userController.updateUser);
router.delete('/delete-user/:id', userController.deleteUser);

module.exports = router; 