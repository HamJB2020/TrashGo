const Contacto = require('../models/Contacto');

exports.enviar = async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const contacto = await Contacto.create({ nombre, email, mensaje });
    return res.status(201).json({ success: true, data: { id: contacto._id }, mensaje: 'Mensaje recibido' });
  } catch (error) {
    console.error('Error al guardar contacto:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};