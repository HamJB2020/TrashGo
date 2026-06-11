const mongoose = require('mongoose');

const contactoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  mensaje: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Contacto', contactoSchema);