const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const notificacionController = require('../controllers/notificacionController');

router.use(verifyToken);

router.get('/', notificacionController.obtenerNotificaciones);

router.get('/no-leidas', notificacionController.noLeidas);

router.put('/:id/leer', notificacionController.marcarLeida);

module.exports = router;
