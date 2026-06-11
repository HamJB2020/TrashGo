const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.register = async (req, res) => {
  let usuario = null;

  try {
    const { username, email, password, direccion } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email y password son obligatorios' });
    }

    const emailLower = email.toLowerCase();
    const existe = await Usuario.findOne({ email: emailLower });
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    usuario = await Usuario.create({
      nombre: username,
      email: emailLower,
      password: passwordHash,
      direccion
    });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return res.status(201).json({
      success: true,
      data: { usuario: { id: usuario._id, username: usuario.nombre, email: usuario.email }, token }
    });

  } catch (error) {
    if (usuario) {
      await Usuario.deleteOne({ _id: usuario._id });
    }
    const msg = error.name === 'MongooseError' || error.name === 'MongooseServerSelectionError'
      ? 'Base de datos no disponible'
      : 'Error interno del servidor';
    console.error('Error al registrar:', error);
    return res.status(500).json({ error: msg });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json({
      success: true,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
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
    const { nombre, telefono, direccion } = req.body;
    const update = {};
    if (nombre !== undefined) update.nombre = nombre.trim();
    if (telefono !== undefined) update.telefono = telefono;
    if (direccion !== undefined) update.direccion = direccion;

    const usuario = await Usuario.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.status(200).json({
      success: true,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
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
      return res.status(400).json({ error: 'email y password son obligatorios' });
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
      data: { usuario: { id: usuario._id, username: usuario.nombre, email: usuario.email }, token }
    });

  } catch (error) {
    const msg = error.name === 'MongooseError' || error.name === 'MongooseServerSelectionError'
      ? 'Base de datos no disponible'
      : 'Error interno del servidor';
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: msg });
  }
};
