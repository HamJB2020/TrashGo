const Incidencia = require('../models/Incidencia');

exports.crearIncidencia = async (req, res) => {
  try {
    const { recogidaId, descripcion } = req.body;
    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: 'La descripción de la incidencia es obligatoria' });
    }

    const existe = await Incidencia.findOne({ recogida_id: recogidaId, usuario_id: req.user.id });
    if (existe) {
      return res.status(400).json({ error: 'Ya reportaste una incidencia para esta recogida' });
    }

    const incidencia = await Incidencia.create({
      recogida_id: recogidaId,
      usuario_id: req.user.id,
      descripcion: descripcion.trim()
    });

    return res.status(201).json({
      success: true,
      data: { id: incidencia._id, recogida_id: incidencia.recogida_id, descripcion: incidencia.descripcion, fecha: incidencia.fecha }
    });
  } catch (error) {
    console.error('Error al crear incidencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
