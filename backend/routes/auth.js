const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/database');

// Configurar transporte SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Helper para enviar email
async function sendResetEmail(email, resetToken, userName) {
  const resetUrl = `${process.env.BACKEND_URL}?reset-token=${resetToken}`;
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Recuperación de contraseña - Reservas Millenia',
    html: `
      <h2>Hola ${userName},</h2>
      <p>Hemos recibido una solicitud para recuperar tu contraseña.</p>
      <p>Este enlace es válido durante 30 minutos:</p>
      <p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #0E6BA8; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Recuperar Contraseña</a></p>
      <p>O copia este código: <strong>${resetToken}</strong></p>
      <p>Si no solicitaste este cambio, ignora este email.</p>
      <p>Saludos,<br/>Millenia</p>
    `
  };

  return transporter.sendMail(mailOptions);
}


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
      query = 'SELECT id, name, email, phone, password_hash, category, initials, role, must_change_password, token_version, activo FROM users WHERE email = $1';
      params = [email];
    } else {
      query = 'SELECT id, name, email, phone, password_hash, category, initials, role, must_change_password, token_version, activo FROM users WHERE phone = $1';
      params = [phone];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Validar que el usuario esté activo
    if (!user.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

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
        category: user.category,
        role: user.role,
        token_version: user.token_version
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      must_change_password: user.must_change_password,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        category: user.category,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Buscar usuario por email
    const userResult = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Por seguridad, no decir que el email no existe
      return res.json({ message: 'Si el email existe, recibirás instrucciones de recuperación' });
    }

    const user = userResult.rows[0];

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRY || 1800000));

    // Guardar token en BD
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Enviar email
    try {
      await sendResetEmail(user.email, resetToken, user.name);
      console.log(`Email de recuperación enviado a ${user.email}`);
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // Si falla el email, aún devolver éxito (el token está guardado)
    }

    res.json({ message: 'Si el email existe, recibirás instrucciones de recuperación' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y contraseña requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar token válido y no usado
    const tokenResult = await db.query(
      'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const resetTokenRecord = tokenResult.rows[0];

    // Verificar que no haya expirado
    if (new Date(resetTokenRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expirado. Solicita uno nuevo' });
    }

    // Hashear nueva contraseña
    const passwordHash = await bcryptjs.hash(newPassword, 10);

    // Actualizar contraseña del usuario e incrementar token_version para invalidar sesiones
    await db.query(
      'UPDATE users SET password_hash = $1, token_version = token_version + 1, must_change_password = false WHERE id = $2',
      [passwordHash, resetTokenRecord.user_id]
    );

    // Marcar token como usado
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [resetTokenRecord.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente. Por favor, inicia sesión.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

module.exports = router;
