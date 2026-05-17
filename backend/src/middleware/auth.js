const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado o formato inválido',
        code: 'AUTH_MISSING'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    
    next();

  } catch (error) {
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor, inicia sesión nuevamente',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'AUTH_INVALID'
      });
    }

    console.error('Error verificando token:', error);
    return res.status(401).json({
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { verifyToken };
