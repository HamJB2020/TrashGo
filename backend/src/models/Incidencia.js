const mongoose = require('mongoose');

const incidenciaSchema = new mongoose.Schema({
  recogida_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recogida', required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  descripcion: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: 'fecha' } });

incidenciaSchema.index({ recogida_id: 1, usuario_id: 1 }, { unique: true });

module.exports = mongoose.model('Incidencia', incidenciaSchema);
