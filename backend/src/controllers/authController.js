const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.register = async (req, res) => {
  try {
    const { username, email, password, telefono, pais, rol } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const emailLower = email.toLowerCase();
    const existe = await Usuario.findOne({ email: emailLower });
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await Usuario.create({
      nombre: username,
      email: emailLower,
      password: passwordHash,
      telefono,
      pais,
      rol: rol === 'rider' ? 'rider' : 'usuario'
    });

    return res.status(201).json({
      success: true,
      data: { usuario: { id: usuario._id, username: usuario.nombre, email: usuario.email } }
    });

  } catch (error) {
    console.error('Error al registrar:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    return res.status(200).json({
      success: true,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        pais: usuario.pais,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, telefono, pais } = req.body;
    const update = {};
    if (nombre !== undefined) update.nombre = nombre.trim();
    if (telefono !== undefined) update.telefono = telefono;
    if (pais !== undefined) update.pais = pais;

    const usuario = await Usuario.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!usuario) return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });

    return res.status(200).json({
      success: true,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        pais: usuario.pais,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        usuario: { id: usuario._id, username: usuario.nombre, email: usuario.email, rol: usuario.rol },
        token
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
