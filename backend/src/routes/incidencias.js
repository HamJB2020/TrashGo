const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const incidenciaController = require('../controllers/incidenciaController');

router.use(verifyToken);

router.post('/', incidenciaController.crearIncidencia);

module.exports = router;
