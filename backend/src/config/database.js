const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trashgo';

mongoose.connect(MONGO_URI);

mongoose.connection.on('error', (err) => {
  console.error('Error de conexión a MongoDB:', err.message);
});

mongoose.connection.once('open', () => {
  console.log('Conexión a MongoDB establecida');
});

setTimeout(() => {
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB no conectado. Verifica que MONGO_URI esté configurada en las variables de entorno de Render.');
  }
}, 5000);

module.exports = mongoose;
