-- ⚠️⚠️⚠️ PELIGRO: NO EJECUTAR EN PRODUCCION SI QUIERES CONSERVAR DATOS ⚠️⚠️⚠️
-- Seed para reconstruir catalogos y usuarios actuales.
-- Reservas y slots se dejan vacios intencionalmente.
--

-- SEGURIDAD: este script NO se ejecuta si no activas explicitamente la bandera.
-- Para permitir ejecucion destructiva, descomenta esta linea:
-- SET seed.allow_destructive = 'YES_I_UNDERSTAND';

DO $$
BEGIN
  IF COALESCE(current_setting('seed.allow_destructive', true), '') <> 'YES_I_UNDERSTAND' THEN
    RAISE EXCEPTION
      'Seed bloqueado por seguridad. Descomenta: SET seed.allow_destructive = ''YES_I_UNDERSTAND'';';
  END IF;
END $$;

BEGIN;

TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE time_slots CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE studios RESTART IDENTITY CASCADE;

INSERT INTO studios (id, name, description, categories, created_at) VALUES
(1, 'BOX 1', 'Produccion, Mezcla y Mastering', 'PME,EST-SUP', '2026-01-23 18:04:12.168+00'),
(2, 'BOX 2', 'Produccion, Mezcla y Mastering', 'ING', '2026-01-23 18:04:12.168+00'),
(3, 'ESTUDIO D', 'Grabacion', 'ING,EST-SUP', '2026-01-23 18:04:12.168+00'),
(4, 'ESTUDIO C', 'Grabacion', 'PME', '2026-01-23 18:04:12.168+00'),
(5, 'BOX 4', 'Produccion, Mezcla y Mastering', 'ING,PME', '2026-01-23 18:04:12.168+00'),
(6, 'BOX 5', 'Produccion, Sintetizadores', 'PME', '2026-01-23 18:04:12.168+00'),
(7, 'BOX 6', 'Produccion, Sintetizadores', 'PME,EST-SUP', '2026-01-23 18:04:12.168+00'),
(8, 'ESTUDIO B', 'Mezcla y Mastering', 'ING', '2026-01-23 18:04:12.168+00')
ON CONFLICT DO NOTHING;

INSERT INTO users (
  id, name, phone, email, password_hash, category, initials, role,
  activo, must_change_password, token_version, created_at
) VALUES
(1, 'Josep Bru Llorens', '+34612345678', 'josep@millenia.es', '$2a$10$zWVfF1rs/4HZxFLOt1snoO9wWjnHHxAaw33ykCkvcWAye/9jlDRA.', 'PME', 'JBL', 'admin', true, false, 1, '2026-01-23 18:04:12.183+00'),
(2, 'Sara Bernal Vitner', '+34612345679', 'sara@millenia.es', '$2a$10$pKUNAdEoAZKys.zGuCSAi.DgBnZtFDMTFKvZg0dvkzjYz7fcnPjd2', 'ING', 'SBV', 'admin', true, false, 3, '2026-01-23 18:04:12.183+00'),
(3, 'Vicente Mezquita Leal', '+34612345680', 'vicente@millenia.es', '$2a$10$zWVfF1rs/4HZxFLOt1snoO9wWjnHHxAaw33ykCkvcWAye/9jlDRA.', 'ING', 'VML', 'admin', true, false, 1, '2026-01-23 18:04:12.183+00'),
(4, 'Julen Alza Minguez', '+34612345681', 'julen@millenia.es', '$2a$10$zWVfF1rs/4HZxFLOt1snoO9wWjnHHxAaw33ykCkvcWAye/9jlDRA.', 'PME+ING', 'JAM', 'user', true, false, 1, '2026-01-23 18:04:12.183+00'),
(5, 'Joan Ros', '+34612345682', 'joan@millenia.es', '$2a$10$zWVfF1rs/4HZxFLOt1snoO9wWjnHHxAaw33ykCkvcWAye/9jlDRA.', 'EST-SUP', 'JRR', 'user', true, false, 1, '2026-01-23 18:04:12.183+00'),
(6, 'Iñaki Ariste Aznar', '+34612345683', 'iñaki@millenia.es', '$2a$10$T3LfWnJuzrY0ptxwXnazduC34j2YUVNKyUsHXHh8pQ/iaG4v4S75a', 'EST-SUP', 'IAA', 'user', true, false, 2, '2026-01-23 18:04:12.183+00'),
(10, 'Ines Arizmendi Aranda', '612312312', 'pruebaiaa@gmail.com', '$2a$10$zWVfF1rs/4HZxFLOt1snoO9wWjnHHxAaw33ykCkvcWAye/9jlDRA.', 'PME', 'IAA2', 'user', true, false, 1, '2026-03-12 16:43:09.520+00')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('studios', 'id'), COALESCE((SELECT MAX(id) FROM studios), 1), true);
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('time_slots', 'id'), COALESCE((SELECT MAX(id) FROM time_slots), 1), true);
SELECT setval(pg_get_serial_sequence('bookings', 'id'), COALESCE((SELECT MAX(id) FROM bookings), 1), true);

COMMIT;

SELECT 'studios' AS entity, COUNT(*) AS count FROM studios
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'time_slots', COUNT(*) FROM time_slots
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings;
