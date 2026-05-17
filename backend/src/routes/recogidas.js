const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const recogidaController = require('../controllers/recogidaController');

router.get('/disponibles', recogidaController.listadoDisponibles);

router.use(verifyToken);

router.post('/', recogidaController.crearRecogida);

router.get('/:id', recogidaController.obtenerRecogida);

router.put('/:id/aceptar', recogidaController.aceptarRecogida);

module.exports = router;
