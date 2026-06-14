const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/perfil', verifyToken, authController.getProfile);
router.put('/perfil', verifyToken, authController.updateProfile);
router.delete('/perfil', verifyToken, authController.deleteAccount);

module.exports = router;
