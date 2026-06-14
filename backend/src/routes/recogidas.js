const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const recogidaController = require('../controllers/recogidaController');

router.get('/disponibles', recogidaController.listadoDisponibles);

router.post('/', recogidaController.crearRecogida);

router.use(verifyToken);

router.get('/historial-pagos', recogidaController.historialPagos);

router.put('/:id/reagendar', recogidaController.reagendar);

router.get('/mis-recogidas', recogidaController.obtenerMisRecogidas);

router.get('/mis-aceptadas', recogidaController.misAceptadas);

router.get('/:id', recogidaController.obtenerRecogida);

router.put('/:id/aceptar', recogidaController.aceptarRecogida);

router.put('/:id/completar', recogidaController.completarRecogida);

router.put('/:id/pagar', recogidaController.pagarRecogida);

router.put('/:id/cancelar', recogidaController.cancelarRecogida);

router.put('/:id/valorar', recogidaController.valorarRecogida);

module.exports = router;
