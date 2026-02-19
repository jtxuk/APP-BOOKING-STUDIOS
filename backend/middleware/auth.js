const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(bearerToken, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    try {
      // Verificar que el usuario siga activo y con acceso válido
      const result = await db.query(
        'SELECT activo, fin_acceso FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      const user = result.rows[0];
      
      if (!user.activo) {
        return res.status(403).json({ error: 'Acceso desactivado. Contacta con el administrador.' });
      }
      
      if (user.fin_acceso && new Date(user.fin_acceso) < new Date()) {
        return res.status(403).json({ error: 'Tu acceso ha expirado. Contacta con el administrador.' });
      }
      
      req.user = decoded;
      next();
    } catch (dbError) {
      console.error('Error verificando usuario:', dbError);
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
  });
}

module.exports = { verifyToken };

// Middleware para verificar que el usuario es administrador
async function verifyAdmin(req, res, next) {
  try {
    const result = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }
    
    next();
  } catch (error) {
    console.error('Error verificando rol de admin:', error);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
}

module.exports = { verifyToken, verifyAdmin };
