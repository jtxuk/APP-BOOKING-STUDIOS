const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all studios with their time slots for a specific date
router.get('/:studioId/slots/:date', verifyToken, async (req, res) => {
  try {
    const { studioId, date } = req.params;

    // Verify date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use AAAA-MM-DD' });
    }

    // Verificar que el estudio existe
    const studioCheck = await db.query('SELECT id FROM studios WHERE id = $1', [studioId]);
    if (studioCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Estudio no encontrado' });
    }

    // Generar slots automáticamente si no existen para esta fecha
    // Solo para días laborables (lunes a viernes)
    const dayOfWeek = await db.query(
      "SELECT EXTRACT(DOW FROM $1::date) as dow",
      [date]
    );
    const dow = parseInt(dayOfWeek.rows[0].dow);

    // Si es día laborable (1-5 = lunes a viernes)
    if (dow >= 1 && dow <= 5) {
      // Verificar si ya existen slots para esta fecha y estudio
      const existingSlots = await db.query(
        'SELECT id FROM time_slots WHERE studio_id = $1 AND slot_date = $2 LIMIT 1',
        [studioId, date]
      );

      // Si no existen, crearlos
      if (existingSlots.rows.length === 0) {
        const insertSlots = `
          INSERT INTO time_slots (studio_id, slot_number, start_time, end_time, slot_date)
          VALUES 
            ($1, 1, '08:00', '11:00', $2),
            ($1, 2, '11:00', '14:00', $2),
            ($1, 3, '14:00', '17:00', $2),
            ($1, 4, '17:00', '20:00', $2)
          ON CONFLICT DO NOTHING
        `;
        await db.query(insertSlots, [studioId, date]);
      }
    }

    // Obtener los slots con su estado
    const query = `
      SELECT 
        ts.id,
        ts.slot_number,
        ts.start_time,
        ts.end_time,
        ts.studio_id,
        CASE 
          WHEN b.status = 'blocked' THEN 'blocked'
          WHEN b.id IS NOT NULL THEN 'booked'
          ELSE 'available'
        END as status,
        b.user_id,
        u.initials
      FROM time_slots ts
      LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.status IN ('confirmed', 'blocked')
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ts.studio_id = $1 AND ts.slot_date = $2
      ORDER BY ts.slot_number
    `;

    const result = await db.query(query, [studioId, date]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Error al cargar los horarios' });
  }
});

// Get all studios
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT id, name, description, categories FROM studios ORDER BY id';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching studios:', error);
    res.status(500).json({ error: 'Error al cargar los estudios' });
  }
});

module.exports = router;
