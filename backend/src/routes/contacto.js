const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

router.post('/', contactoController.enviar);

module.exports = router;