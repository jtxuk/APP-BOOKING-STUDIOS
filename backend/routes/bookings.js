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

// Helper function to count user's active bookings (only current/future, not past)
async function countUserBookings(userId) {
  const query = `
    SELECT COUNT(*) as count
    FROM bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    WHERE b.user_id = $1 
    AND b.status = 'confirmed'
    AND (ts.slot_date || ' ' || ts.end_time)::timestamp > CURRENT_TIMESTAMP
  `;
  const result = await db.query(query, [userId]);
  return parseInt(result.rows[0].count);
}

function getAcademicYear(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const cutoff = new Date(year, 8, 20); // 20 Septiembre
  return date >= cutoff ? year : year - 1;
}

// Create a new booking
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { studioId, timeSlotId, bookingDate } = req.body;
    const userId = req.user.id;
    const userCategory = req.user.category;
    const isAdmin = req.user.role === 'admin';

    if (!studioId || !timeSlotId || !bookingDate) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar que el slot existe y pertenece al estudio/fecha solicitados
    const slotInfoQuery = `
      SELECT 
        id,
        to_char(slot_date, 'YYYY-MM-DD') as slot_date,
        start_time,
        end_time
      FROM time_slots
      WHERE id = $1 AND studio_id = $2
    `;
    const slotInfoResult = await db.query(slotInfoQuery, [timeSlotId, studioId]);

    if (slotInfoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slot no encontrado para el estudio seleccionado' });
    }

    const slotInfo = slotInfoResult.rows[0];
    if (slotInfo.slot_date !== bookingDate) {
      return res.status(400).json({ error: 'El slot no corresponde con la fecha seleccionada' });
    }

    // Validar que no sea fecha/hora pasada (se permite hasta 30 min después del inicio del slot)
    const pastCheckQuery = `
      SELECT (($1::date + $2::time)::timestamp + INTERVAL '30 minutes' > CURRENT_TIMESTAMP) AS can_book
    `;
    const pastCheckResult = await db.query(pastCheckQuery, [slotInfo.slot_date, slotInfo.start_time]);
    if (!pastCheckResult.rows[0].can_book) {
      return res.status(400).json({ error: 'No se puede reservar un slot pasado' });
    }

    // Restringir fines de semana solo a usuarios no admin
    if (!isAdmin) {
      const bookingDay = new Date(`${slotInfo.slot_date}T00:00:00`).getDay();
      if (bookingDay === 0 || bookingDay === 6) {
        return res.status(400).json({ error: 'No se pueden hacer reservas los sábados y domingos' });
      }
    }

    // Get studio categories to validate user access
    const studioQuery = `SELECT categories FROM studios WHERE id = $1`;
    const studioResult = await db.query(studioQuery, [studioId]);
    
    if (studioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Estudio no encontrado' });
    }

    const studioCategories = studioResult.rows[0].categories.split(',').map(c => c.trim());

    if (!isAdmin) {
      // Validación de acceso según categoría y curso académico
      let allowedCategories = [userCategory];

      if (userCategory === 'PME+ING') {
        const userQuery = await db.query(
          'SELECT category_start_date, created_at FROM users WHERE id = $1',
          [userId]
        );

        const userRow = userQuery.rows[0];
        const startDate = userRow.category_start_date || userRow.created_at;
        const startAcademicYear = getAcademicYear(startDate);
        const bookingAcademicYear = getAcademicYear(slotInfo.slot_date);
        const elapsedCourses = bookingAcademicYear - startAcademicYear;

        // Curso 0 y 1 => PME, curso 2+ => ING
        allowedCategories = elapsedCourses >= 2 ? ['ING'] : ['PME'];
      }

      const hasAccess = studioCategories.some(cat => allowedCategories.includes(cat));
      if (!hasAccess) {
        return res.status(403).json({
          error: `Tu categoría (${userCategory}) no tiene acceso a este estudio en este momento. Categorías permitidas: ${studioCategories.join(', ')}`
        });
      }
    }

    // Límites de reservas solo para usuarios no admin
    let bookingCount = 0;
    if (!isAdmin) {
      bookingCount = await countUserBookings(userId);
      if (bookingCount >= 2) {
        return res.status(400).json({ error: 'Máximo 2 reservas permitidas' });
      }
    }

    // Check if time slot is already booked
    const slotCheck = await db.query(
      `SELECT id FROM bookings WHERE time_slot_id = $1 AND status = 'confirmed'`,
      [timeSlotId]
    );
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este horario ya está reservado' });
    }

    // Verificar que el usuario no tenga ya una reserva en el mismo horario (cualquier estudio)
    if (!isAdmin) {
      const conflictQuery = `
        SELECT b.id
        FROM bookings b
        JOIN time_slots ts ON b.time_slot_id = ts.id
        WHERE b.user_id = $1
        AND b.status = 'confirmed'
        AND ts.slot_date = $2
        AND ts.start_time = $3
        AND ts.end_time = $4
      `;
      const conflictResult = await db.query(conflictQuery, [userId, slotInfo.slot_date, slotInfo.start_time, slotInfo.end_time]);
      if (conflictResult.rows.length > 0) {
        return res.status(400).json({ error: 'Ya tienes una reserva en ese mismo horario en otro estudio' });
      }
    }

    // Restricción de slots consecutivos solo para usuarios no admin
    if (!isAdmin) {
      const hasConsecutive = await hasConsecutiveSlotsInStudio(userId, studioId);
      if (hasConsecutive && bookingCount === 1) {
        return res.status(400).json({ error: 'No se pueden reservar slots consecutivos en el mismo estudio' });
      }
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
    
    // Detectar colisión de slot activo (constraint antigua o índice parcial nuevo)
    if (
      error.code === '23505' &&
      ['bookings_time_slot_id_key', 'bookings_active_time_slot_unique'].includes(error.constraint)
    ) {
      return res.status(409).json({ error: 'Lo siento. ¡Justo ha sido reservado hace un segundo!' });
    }
    
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

// Get user's bookings (only current/future, not past)
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
      AND (ts.slot_date || ' ' || ts.end_time)::timestamp > CURRENT_TIMESTAMP
      ORDER BY ts.slot_date DESC, ts.slot_number
    `;

    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error al cargar las reservas' });
  }
});

// Cancel a booking (only allowed 3+ hours before start time)
router.delete('/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify the booking belongs to the user and get slot info
    const bookingCheck = await db.query(`
      SELECT 
        b.id,
        ROUND(EXTRACT(EPOCH FROM (((ts.slot_date + ts.start_time::time)::timestamp) - CURRENT_TIMESTAMP)) / 60.0) AS minutes_until_start
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.id
      WHERE b.id = $1 AND b.user_id = $2 AND b.status = $3
    `, [bookingId, userId, 'confirmed']);

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya cancelada' });
    }

    const booking = bookingCheck.rows[0];
    const minutesUntilStart = Number(booking.minutes_until_start);

    // Check if cancellation deadline has passed (less than 3 horas until start)
    if (minutesUntilStart < 180) {
      return res.status(400).json({ 
        error: 'No se puede cancelar con menos de 3 horas para el inicio' 
      });
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
