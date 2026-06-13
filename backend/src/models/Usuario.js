const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  telefono: { type: String, trim: true },
  direccion: { type: String, trim: true },
  pais: { type: String, trim: true },
  calle: { type: String, trim: true },
  rol: { type: String, enum: ['usuario', 'rider'], default: 'usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
