const Notificacion = require('../models/Notificacion');

exports.obtenerNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const data = notificaciones.map(n => ({
      id: n._id,
      tipo: n.tipo,
      mensaje: n.mensaje,
      leida: n.leida,
      referencia_id: n.referencia_id,
      createdAt: n.createdAt
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuario_id: req.user.id },
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    return res.status(200).json({ success: true, data: { id: notificacion._id, leida: true } });
  } catch (error) {
    console.error('Error al marcar notificación como leida:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.noLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({ usuario_id: req.user.id, leida: false });
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
