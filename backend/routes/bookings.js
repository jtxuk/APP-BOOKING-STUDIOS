const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Helper function to check if user has consecutive bookings in same studio
async function hasConsecutiveSlotsInStudio(userId, studioId) {
  const query = `
    SELECT COUNT(*) as count
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    WHERE b.user_id = $1 
    AND ts.studio_id = $2 
    AND b.status = 'confirmed'
  `;
  const result = await db.query(query, [userId, studioId]);
  return parseInt(result.rows[0].count) > 0;
}

// Helper function to count user's active bookings
async function countUserBookings(userId) {
  const query = `
    SELECT COUNT(*) as count
    FROM bookings
    WHERE user_id = $1 AND status = 'confirmed'
  `;
  const result = await db.query(query, [userId]);
  return parseInt(result.rows[0].count);
}

// Create a new booking
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { studioId, timeSlotId, bookingDate } = req.body;
    const userId = req.user.id;
    const userCategory = req.user.category;

    if (!studioId || !timeSlotId || !bookingDate) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar que no sea sábado o domingo
    const bookingDay = new Date(bookingDate).getDay();
    if (bookingDay === 0 || bookingDay === 6) {
      return res.status(400).json({ error: 'No se pueden hacer reservas los sábados y domingos' });
    }

    // Get studio categories to validate user access
    const studioQuery = `SELECT categories FROM studios WHERE id = $1`;
    const studioResult = await db.query(studioQuery, [studioId]);
    
    if (studioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Estudio no encontrado' });
    }

    const studioCategories = studioResult.rows[0].categories.split(',').map(c => c.trim());

    // Validación de acceso según categoría y tiempo transcurrido
    let allowedCategories = [userCategory];
    
    if (userCategory === 'PME+ING') {
      // Obtener fecha de creación del usuario
      const userQuery = await db.query('SELECT created_at FROM users WHERE id = $1', [userId]);
      const userCreatedAt = new Date(userQuery.rows[0].created_at);
      const now = new Date();
      const yearsSinceCreation = (now - userCreatedAt) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (yearsSinceCreation < 2) {
        // Primeros 2 años: acceso a PME
        allowedCategories = ['PME'];
      } else {
        // Año 3: acceso a ING
        allowedCategories = ['ING'];
      }
    }

    // Check if user's category is allowed in this studio
    const hasAccess = studioCategories.some(cat => allowedCategories.includes(cat));
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: `Tu categoría (${userCategory}) no tiene acceso a este estudio en este momento. Categorías permitidas: ${studioCategories.join(', ')}` 
      });
    }

    // Check if user already has 2 bookings
    const bookingCount = await countUserBookings(userId);
    if (bookingCount >= 2) {
      return res.status(400).json({ error: 'Máximo 2 reservas permitidas' });
    }

    // Check if time slot is already booked
    const slotCheck = await db.query(
      `SELECT id FROM bookings WHERE time_slot_id = $1 AND status = 'confirmed'`,
      [timeSlotId]
    );
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este horario ya está reservado' });
    }

    // Check for consecutive slots in the same studio
    const hasConsecutive = await hasConsecutiveSlotsInStudio(userId, studioId);
    if (hasConsecutive && bookingCount === 1) {
      return res.status(400).json({ error: 'No se pueden reservar slots consecutivos en el mismo estudio' });
    }

    // Create the booking
    const bookingQuery = `
      INSERT INTO bookings (user_id, studio_id, time_slot_id, booking_date, status)
      VALUES ($1, $2, $3, $4, 'confirmed')
      RETURNING id, user_id, studio_id, time_slot_id, booking_date, status, created_at
    `;

    const bookingResult = await db.query(bookingQuery, [userId, studioId, timeSlotId, bookingDate]);
    res.status(201).json(bookingResult.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Detectar violación de UNIQUE constraint (código 23505 en PostgreSQL)
    if (error.code === '23505' && error.constraint === 'bookings_time_slot_id_key') {
      return res.status(409).json({ error: 'Lo siento. ¡Justo ha sido reservado hace un segundo!' });
    }
    
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

// Get user's bookings
router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.studio_id,
        s.name as studio_name,
        ts.slot_number,
        ts.start_time,
        ts.end_time,
        ts.slot_date,
        b.status,
        b.created_at
      FROM bookings b
      JOIN studios s ON b.studio_id = s.id
      JOIN time_slots ts ON b.time_slot_id = ts.id
      WHERE b.user_id = $1 AND b.status = 'confirmed'
      ORDER BY ts.slot_date DESC, ts.slot_number
    `;

    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error al cargar las reservas' });
  }
});

// Cancel a booking
router.delete('/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify the booking belongs to the user
    const bookingCheck = await db.query(
      'SELECT id FROM bookings WHERE id = $1 AND user_id = $2 AND status = $3',
      [bookingId, userId, 'confirmed']
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya cancelada' });
    }

    // Update booking status to cancelled
    const updateQuery = `
      UPDATE bookings 
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, status, cancelled_at
    `;

    const result = await db.query(updateQuery, [bookingId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
});

module.exports = router;
