const mongoose = require('mongoose');

const recogidaSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  direccion: { type: String, required: true, trim: true },
  tipo_residuo: { type: String, required: true, enum: ['orgánico', 'inorgánico', 'mixto', 'especial'] },
  descripcion: { type: String, trim: true },
  urgencia: { type: String, enum: ['normal', 'alta'], default: 'normal' },
  estado: { type: String, enum: ['pendiente', 'aceptada', 'completada', 'cancelada'], default: 'pendiente' },
  rider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  fecha_aceptacion: { type: Date }
}, { timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' } });

module.exports = mongoose.model('Recogida', recogidaSchema);
