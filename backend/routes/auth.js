const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const db = require('../config/database');

// Login endpoint - email OR phone
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validar que se proporcione email o teléfono
    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email/teléfono y contraseña requeridos' });
    }

    // Buscar usuario por email o teléfono
    let query, params;
    if (email) {
      query = 'SELECT id, name, email, phone, password_hash, category, initials FROM users WHERE email = $1';
      params = [email];
    } else {
      query = 'SELECT id, name, email, phone, password_hash, category, initials FROM users WHERE phone = $1';
      params = [phone];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        phone: user.phone,
        name: user.name, 
        initials: user.initials,
        category: user.category
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        category: user.category
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
