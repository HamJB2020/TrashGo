const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trashgo';

mongoose.connect(MONGO_URI);

mongoose.connection.on('error', (err) => {
  console.error('Error de conexión a MongoDB:', err);
  process.exit(-1);
});

mongoose.connection.once('open', () => {
  console.log('Conexión a MongoDB establecida');
});

module.exports = mongoose;
