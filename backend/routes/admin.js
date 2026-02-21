const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Middleware: todas las rutas requieren autenticación y rol admin
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, phone, email, category, initials, role, fin_acceso, activo, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/admin/users/:id - Obtener un usuario específico
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, name, phone, email, category, initials, role, fin_acceso, activo, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/users', async (req, res) => {
  try {
    const { name, phone, email, password, category, initials, role = 'user' } = req.body;
    
    // Validar campos requeridos
    if (!name || !email || !password || !category || !initials) {
      return res.status(400).json({ error: 'Faltan campos requeridos: name, email, password, category, initials' });
    }
    
    // Validar categoría
    const validCategories = ['PME', 'EST-SUP', 'ING', 'PME+ING'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Categoría inválida. Debe ser: PME, EST-SUP, ING, o PME+ING' });
    }
    
    // Validar role
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Role inválido. Debe ser: admin o user' });
    }
    
    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insertar usuario (fin_acceso se calcula automáticamente por trigger)
    const result = await db.query(
      'INSERT INTO users (name, phone, email, password_hash, category, initials, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, phone, email, category, initials, role, fin_acceso, activo, created_at',
      [name, phone, email, password_hash, category, initials, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    // Manejar errores de unique constraint
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      if (error.constraint === 'users_phone_key') {
        return res.status(409).json({ error: 'El teléfono ya está registrado' });
      }
      if (error.constraint === 'users_initials_key') {
        return res.status(409).json({ error: 'Las iniciales ya están en uso' });
      }
    }
    
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, category, initials, role, fin_acceso, activo } = req.body;
    const shouldNullAccessDate = role === 'admin';
    
    // Construir query dinámica solo con campos proporcionados
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (category !== undefined) {
      const validCategories = ['PME', 'EST-SUP', 'ING', 'PME+ING'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Categoría inválida' });
      }
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (initials !== undefined) {
      updates.push(`initials = $${paramCount++}`);
      values.push(initials);
    }
    if (role !== undefined) {
      if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ error: 'Role inválido' });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (fin_acceso !== undefined && !shouldNullAccessDate) {
      updates.push(`fin_acceso = $${paramCount++}`);
      values.push(fin_acceso);
    }
    if (shouldNullAccessDate) {
      updates.push('fin_acceso = NULL');
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount++}`);
      values.push(activo);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, phone, email, category, initials, role, fin_acceso, activo, created_at`;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    // Manejar errores de unique constraint
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      if (error.constraint === 'users_phone_key') {
        return res.status(409).json({ error: 'El teléfono ya está registrado' });
      }
      if (error.constraint === 'users_initials_key') {
        return res.status(409).json({ error: 'Las iniciales ya están en uso' });
      }
    }
    
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/admin/users/:id - Desactivar usuario (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir que el admin se desactive a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }
    
    const result = await db.query(
      'UPDATE users SET activo = false WHERE id = $1 RETURNING id, name, email, activo',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario desactivado', user: result.rows[0] });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

// ====== GESTIÓN DE RESERVAS (ADMIN) ======

// GET /api/admin/bookings - Ver todas las reservas
router.get('/bookings', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        u.name as user_name,
        u.initials as user_initials,
        b.time_slot_id,
        ts.slot_date,
        ts.start_time,
        ts.end_time,
        ts.studio_id,
        s.name as studio_name,
        b.status,
        b.created_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN time_slots ts ON b.time_slot_id = ts.id
      JOIN studios s ON ts.studio_id = s.id
      WHERE b.status = 'confirmed'
      ORDER BY ts.slot_date DESC, ts.start_time DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// POST /api/admin/bookings - Crear reserva para cualquier usuario
router.post('/bookings', async (req, res) => {
  try {
    const { userId, timeSlotId } = req.body;
    
    if (!userId || !timeSlotId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Verificar que el slot existe y está disponible
    const slotCheck = await db.query(
      'SELECT id FROM time_slots WHERE id = $1',
      [timeSlotId]
    );
    
    if (slotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Slot no encontrado' });
    }
    
    // Verificar si ya está reservado
    const bookingCheck = await db.query(
      'SELECT id FROM bookings WHERE time_slot_id = $1 AND status = $2',
      [timeSlotId, 'confirmed']
    );
    
    if (bookingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Este slot ya está reservado' });
    }
    
    // Crear la reserva
    const result = await db.query(
      'INSERT INTO bookings (user_id, time_slot_id, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, timeSlotId, 'confirmed']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// DELETE /api/admin/bookings/:id - Cancelar cualquier reserva
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['cancelled', id, 'confirmed']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    res.json({ message: 'Reserva cancelada', booking: result.rows[0] });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

// POST /api/admin/slots/block - Bloquear un slot
router.post('/slots/block', async (req, res) => {
  try {
    const { timeSlotId } = req.body;
    
    if (!timeSlotId) {
      return res.status(400).json({ error: 'timeSlotId es requerido' });
    }
    
    // Crear una reserva "bloqueada" sin usuario
    const result = await db.query(
      'INSERT INTO bookings (time_slot_id, status, user_id) VALUES ($1, $2, NULL) RETURNING *',
      [timeSlotId, 'blocked']
    );
    
    res.status(201).json({ message: 'Slot bloqueado', booking: result.rows[0] });
  } catch (error) {
    console.error('Error al bloquear slot:', error);
    
    // Si ya existe una reserva
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El slot ya está reservado o bloqueado' });
    }
    
    res.status(500).json({ error: 'Error al bloquear slot' });
  }
});

// DELETE /api/admin/slots/unblock/:timeSlotId - Desbloquear un slot
router.delete('/slots/unblock/:timeSlotId', async (req, res) => {
  try {
    const { timeSlotId } = req.params;
    
    const result = await db.query(
      'DELETE FROM bookings WHERE time_slot_id = $1 AND status = $2 RETURNING *',
      [timeSlotId, 'blocked']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot bloqueado no encontrado' });
    }
    
    res.json({ message: 'Slot desbloqueado', booking: result.rows[0] });
  } catch (error) {
    console.error('Error al desbloquear slot:', error);
    res.status(500).json({ error: 'Error al desbloquear slot' });
  }
});

module.exports = router;
