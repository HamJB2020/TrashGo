const pool = require('../config/database');

exports.crearRecogida = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { direccion, tipoResiduo, descripcion, urgencia } = req.body;

    if (!direccion || !tipoResiduo) {
      return res.status(400).json({
        error: 'Campos faltantes: direccion y tipoResiduo son obligatorios',
        code: 'VALIDATION_ERROR'
      });
    }

    const tiposValidos = ['orgánico', 'inorgánico', 'mixto', 'especial'];
    if (!tiposValidos.includes(tipoResiduo.toLowerCase())) {
      return res.status(400).json({
        error: `Tipo de residuo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`,
        code: 'INVALID_RESIDUE_TYPE'
      });
    }

    if (direccion.trim().length < 10) {
      return res.status(400).json({
        error: 'La dirección debe tener al menos 10 caracteres',
        code: 'INVALID_ADDRESS'
      });
    }

    await client.query('BEGIN');

    const usuarioId = req.user.id;
    const estado = 'pendiente';
    const fechaCreacion = new Date().toISOString();

    const queryInsert = `
      INSERT INTO recogidas (
        usuario_id, 
        direccion, 
        tipo_residuo, 
        descripcion, 
        urgencia, 
        estado, 
        fecha_creacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id AS recogidaId,
        estado,
        fecha_creacion AS createdAt
    `;

    const resultado = await client.query(queryInsert, [
      usuarioId,
      direccion.trim(),
      tipoResiduo.toLowerCase(),
      descripcion || null,
      urgencia || 'normal',
      estado,
      fechaCreacion
    ]);

    const recogida = resultado.rows[0];

    await client.query(`
      INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, fecha)
      VALUES ($1, $2, $3, $4, $5)
    `, [usuarioId, 'CREATE', 'recogidas', recogida.recogidaId, new Date()]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      data: recogida,
      mensaje: 'Solicitud de recogida creada exitosamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    console.error('❌ Error al crear recogida:', error);

    if (error.code === '23505') { 
      return res.status(409).json({
        error: 'Ya existe una recogida pendiente para este usuario',
        code: 'DUPLICATE_REQUEST'
      });
    }

    if (error.code === '23503') {
      return res.status(404).json({
        error: 'Usuario no existe',
        code: 'USER_NOT_FOUND'
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor al crear recogida',
      code: 'SERVER_ERROR'
    });

  } finally {
    client.release();
  }
};


exports.obtenerRecogida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const querySelect = `
      SELECT 
        id,
        usuario_id,
        direccion,
        tipo_residuo,
        descripcion,
        urgencia,
        estado,
        fecha_creacion,
        rider_id,
        fecha_aceptacion
      FROM recogidas
      WHERE id = $1 AND usuario_id = $2
    `;

    const resultado = await pool.query(querySelect, [id, usuarioId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Recogida no encontrada o no tienes permisos',
        code: 'NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al obtener recogida:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'SERVER_ERROR'
    });
  }
};


exports.listadoDisponibles = async (req, res) => {
  try {
    const { 
      estado = 'pendiente', 
      tipoResiduo, 
      pagina = 1, 
      limite = 20 
    } = req.query;
    
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    let queryBase = `
      SELECT 
        r.id,
        r.direccion,
        r.tipo_residuo,
        r.urgencia,
        r.estado,
        r.fecha_creacion,
        u.nombre AS usuario_nombre,
        u.telefono AS usuario_telefono
      FROM recogidas r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.estado = $1 AND r.rider_id IS NULL
    `;

    const params = [estado];
    let paramIndex = 2;

    if (tipoResiduo) {
      queryBase += ` AND r.tipo_residuo = $${paramIndex}`;
      params.push(tipoResiduo.toLowerCase());
      paramIndex++;
    }

    queryBase += ` ORDER BY r.urgencia DESC, r.fecha_creacion ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    params.push(parseInt(limite), offset);

    const resultado = await pool.query(queryBase, params);

    let queryCount = `SELECT COUNT(*) as total FROM recogidas WHERE estado = $1 AND rider_id IS NULL`;
    const countParams = [estado];
    
    if (tipoResiduo) {
      queryCount += ` AND tipo_residuo = $2`;
      countParams.push(tipoResiduo.toLowerCase());
    }

    const countResult = await pool.query(queryCount, countParams);
    const total = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      data: resultado.rows,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: total,
        paginas: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('❌ Error al listar recogidas disponibles:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'SERVER_ERROR'
    });
  }
};


exports.aceptarRecogida = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const riderId = req.user.id;

    await client.query('BEGIN');

    const checkQuery = `
      SELECT id FROM recogidas 
      WHERE id = $1 AND rider_id IS NULL AND estado = 'pendiente'
    `;
    
    const checkResult = await client.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(409).json({
        error: 'Recogida no disponible (ya fue aceptada)',
        code: 'NOT_AVAILABLE'
      });
    }

    const updateQuery = `
      UPDATE recogidas 
      SET rider_id = $1, estado = 'aceptada', fecha_aceptacion = NOW()
      WHERE id = $2
      RETURNING id, estado, rider_id
    `;

    const resultado = await client.query(updateQuery, [riderId, id]);
    
    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      data: resultado.rows[0],
      mensaje: 'Solicitud aceptada'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al aceptar recogida:', error);
    return res.status(500).json({
      error: 'Error al aceptar recogida',
      code: 'SERVER_ERROR'
    });
  } finally {
    client.release();
  }
};
