-- Script para inicializar la base de datos con datos de ejemplo
-- ATENCIÓN: Este script elimina todos los datos existentes

-- Limpiar tablas en orden correcto (respetando foreign keys)
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE time_slots CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE studios RESTART IDENTITY CASCADE;

-- Insertar estudios
INSERT INTO studios (name, description, categories) VALUES
('BOX 1', 'Producción, Mezcla y Mastering', 'PME,EST-SUP'),
('BOX 2', 'Producción, Mezcla y Mastering', 'ING'),
('ESTUDIO D', 'Grabación', 'ING,EST-SUP'),
('ESTUDIO C', 'Grabación', 'PME,EST-SUP'),
('BOX 4', 'Producción, Mezcla y Mastering', 'ING,PME'),
('BOX 5', 'Producción, Sintetizadores', 'PME'),
('BOX 6', 'Producción, Sintetizadores', 'PME,EST-SUP'),
('ESTUDIO B', 'Mezcla y Mastering', 'ING')
ON CONFLICT DO NOTHING;

-- Insertar usuarios de ejemplo
-- Password para todos: 123456
-- fin_acceso se calcula automáticamente mediante trigger:
--   PME: 30 julio + 2 años
--   EST-SUP: 30 julio + 2 años
--   ING: 30 julio + 1 año
--   ING+PME: 30 julio + 3 años
-- Juan es el administrador (role='admin')
INSERT INTO users (name, phone, email, password_hash, category, initials, role) VALUES
('Juan Perez', '+34612345678', 'juan@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'PME', 'JPZ', 'admin'),
('María García', '+34612345679', 'maria@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'PME', 'MGC', 'user'),
('Carlos López', '+34612345680', 'carlos@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'ING', 'CLP', 'user'),
('Sofia Martínez', '+34612345681', 'sofia@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'ING', 'SMZ', 'user'),
('Miguel Rodríguez', '+34612345682', 'miguel@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'EST-SUP', 'MRZ', 'user'),
('Ana Torres', '+34612345683', 'ana@example.com', '$2a$10$VdGqak2cKeJZc27cxyXda.lMd/zl8DNKUk/Mrq9sA7SjmMvjAvrOe', 'EST-SUP', 'ATR', 'user')
ON CONFLICT DO NOTHING;

-- Función para generar los time slots para todas las fechas y estudios
-- Excluye sábados (6) y domingos (0)
DO $$
DECLARE
    v_studio_id INTEGER;
    v_slot_num INTEGER;
    v_date DATE;
    v_start_hour INTEGER;
    v_day_of_week INTEGER;
BEGIN
    FOR v_studio_id IN SELECT id FROM studios LOOP
        FOR v_date IN SELECT CURRENT_DATE + i FROM generate_series(0, 30) i LOOP
            v_day_of_week := EXTRACT(DOW FROM v_date);
            -- Saltar sábados (6) y domingos (0)
            IF v_day_of_week NOT IN (0, 6) THEN
                FOR v_slot_num IN 1..4 LOOP
                    v_start_hour := 8 + (v_slot_num - 1) * 3;
                    INSERT INTO time_slots (studio_id, slot_number, start_time, end_time, slot_date)
                    VALUES (
                        v_studio_id,
                        v_slot_num,
                        LPAD(v_start_hour::TEXT, 2, '0') || ':00',
                        LPAD((v_start_hour + 3)::TEXT, 2, '0') || ':00',
                        v_date
                    )
                    ON CONFLICT DO NOTHING;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Mostrar estadísticas
SELECT 'Studios' as entity, COUNT(*) as count FROM studios
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Time Slots', COUNT(*) FROM time_slots
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings;
