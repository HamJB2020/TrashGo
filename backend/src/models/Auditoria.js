const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  tabla_afectada: { type: String, required: true },
  registro_id: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('Auditoria', auditoriaSchema);
