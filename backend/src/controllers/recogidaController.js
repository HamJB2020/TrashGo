const jwt = require('jsonwebtoken');
const Recogida = require('../models/Recogida');
const Auditoria = require('../models/Auditoria');

exports.crearRecogida = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
      } catch (e) {
        // token inválido o expirado, req.user queda undefined
      }
    }

    let { direccion, tipoResiduo, descripcion, urgencia } = req.body;

    if (!direccion || !tipoResiduo) {
      return res.status(400).json({
        error: 'Campos faltantes: direccion y tipoResiduo son obligatorios',
        code: 'VALIDATION_ERROR'
      });
    }

    const tiposValidos = ['orgánico', 'inorgánico', 'mixto', 'especial', 'vidrio', 'plástico', 'papel/cartón', 'metal', 'electrónico', 'madera', 'textil', 'pilas/baterías', 'aceite', 'escombros', 'poda/jardín', 'voluminoso'];

    if (!Array.isArray(tipoResiduo)) {
      tipoResiduo = [tipoResiduo];
    }

    const tiposNormalizados = tipoResiduo.map(t => t.toLowerCase());
    const invalidos = tiposNormalizados.filter(t => !tiposValidos.includes(t));
    if (invalidos.length > 0) {
      return res.status(400).json({
        error: `Tipo(s) de residuo inválido(s): ${invalidos.join(', ')}. Válidos: ${tiposValidos.join(', ')}`,
        code: 'INVALID_RESIDUE_TYPE'
      });
    }

    if (direccion.trim().length < 10) {
      return res.status(400).json({
        error: 'La dirección debe tener al menos 10 caracteres',
        code: 'INVALID_ADDRESS'
      });
    }

    const recogida = await Recogida.create({
      usuario_id: req.user?.id || null,
      direccion: direccion.trim(),
      latitud: req.body.latitud || null,
      longitud: req.body.longitud || null,
      tipo_residuo: tiposNormalizados,
      descripcion: descripcion || null,
      urgencia: urgencia || 'normal',
      fecha_programada: req.body.fechaProgramada || null,
      coste: req.body.coste || 0
    });

    if (req.user?.id) {
      await Auditoria.create({
        usuario_id: req.user.id,
        accion: 'CREATE',
        tabla_afectada: 'recogidas',
        registro_id: recogida._id
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        recogidaId: recogida._id,
        estado: recogida.estado,
        createdAt: recogida.fecha_creacion
      },
      mensaje: 'Solicitud de recogida creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear recogida:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al crear recogida',
      code: 'SERVER_ERROR'
    });
  }
};

exports.obtenerRecogida = async (req, res) => {
  try {
    const recogida = await Recogida.findOne({
      _id: req.params.id,
      usuario_id: req.user.id
    });

    if (!recogida) {
      return res.status(404).json({
        error: 'Recogida no encontrada o no tienes permisos',
        code: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      data: recogida
    });

  } catch (error) {
    console.error('Error al obtener recogida:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'SERVER_ERROR'
    });
  }
};

exports.listadoDisponibles = async (req, res) => {
  try {
    const { estado = 'pendiente', tipoResiduo, pagina = 1, limite = 20 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const filtro = { estado, rider_id: null };

    if (tipoResiduo) {
      filtro.tipo_residuo = { $in: [tipoResiduo.toLowerCase()] };
    }

    const [recogidas, total] = await Promise.all([
      Recogida.find(filtro)
        .populate('usuario_id', 'nombre telefono')
        .sort({ urgencia: -1, fecha_creacion: 1 })
        .skip(skip)
        .limit(parseInt(limite))
        .lean(),
      Recogida.countDocuments(filtro)
    ]);

    const data = recogidas.map(r => ({
      id: r._id,
      direccion: r.direccion,
      tipo_residuo: r.tipo_residuo,
      urgencia: r.urgencia,
      estado: r.estado,
      fecha_creacion: r.fecha_creacion,
      coste: r.coste,
      usuario_nombre: r.usuario_id?.nombre,
      usuario_telefono: r.usuario_id?.telefono
    }));

    return res.status(200).json({
      success: true,
      data,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('Error al listar recogidas disponibles:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'SERVER_ERROR'
    });
  }
};

exports.obtenerMisRecogidas = async (req, res) => {
  try {
    const recogidas = await Recogida.find({ usuario_id: req.user.id })
      .sort({ fecha_creacion: -1 })
      .lean();

    const data = recogidas.map(r => ({
      id: r._id,
      direccion: r.direccion,
      latitud: r.latitud,
      longitud: r.longitud,
      tipo_residuo: r.tipo_residuo,
      descripcion: r.descripcion,
      urgencia: r.urgencia,
      estado: r.estado,
      fecha_creacion: r.fecha_creacion,
      fecha_programada: r.fecha_programada,
      coste: r.coste
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Error al obtener mis recogidas:', error);
    return res.status(500).json({ error: 'Error interno del servidor', code: 'SERVER_ERROR' });
  }
};

exports.aceptarRecogida = async (req, res) => {
  try {
    const recogida = await Recogida.findOneAndUpdate(
      {
        _id: req.params.id,
        rider_id: null,
        estado: 'pendiente'
      },
      {
        rider_id: req.user.id,
        estado: 'aceptada',
        fecha_aceptacion: new Date()
      },
      { new: true }
    );

    if (!recogida) {
      return res.status(409).json({
        error: 'Recogida no disponible (ya fue aceptada)',
        code: 'NOT_AVAILABLE'
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: recogida._id, estado: recogida.estado, rider_id: recogida.rider_id },
      mensaje: 'Solicitud aceptada'
    });

  } catch (error) {
    console.error('Error al aceptar recogida:', error);
    return res.status(500).json({
      error: 'Error al aceptar recogida',
      code: 'SERVER_ERROR'
    });
  }
};
