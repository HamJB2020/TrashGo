const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, enum: ['recogida_aceptada', 'recogida_completada', 'nueva_disponible', 'pago_recibido'], required: true },
  mensaje: { type: String, required: true },
  leida: { type: Boolean, default: false },
  referencia_id: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

module.exports = mongoose.model('Notificacion', notificacionSchema);
