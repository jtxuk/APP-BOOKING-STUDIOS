const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('PME', 'EST-SUP', 'ING', 'PME+ING')),
        initials VARCHAR(3) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        fin_acceso DATE,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agregar columnas fin_acceso, activo y role si no existen (para DBs existentes)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fin_acceso') THEN
          ALTER TABLE users ADD COLUMN fin_acceso DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='activo') THEN
          ALTER TABLE users ADD COLUMN activo BOOLEAN DEFAULT true;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user'));
        END IF;
      END $$;
    `);

    // Crear o reemplazar función para calcular fin_acceso
    await pool.query(`
      CREATE OR REPLACE FUNCTION calcular_fin_acceso(p_category VARCHAR, p_created_at TIMESTAMP)
      RETURNS DATE AS $$
      DECLARE
        anio_registro INTEGER;
        duracion INTEGER;
      BEGIN
        anio_registro := EXTRACT(YEAR FROM p_created_at);
        
        CASE p_category
          WHEN 'PME' THEN duracion := 2;
          WHEN 'EST-SUP' THEN duracion := 2;
          WHEN 'ING' THEN duracion := 1;
          WHEN 'PME+ING' THEN duracion := 3;
          ELSE duracion := 1;
        END CASE;
        
        RETURN MAKE_DATE(anio_registro + duracion, 7, 30);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Crear o reemplazar trigger para calcular fin_acceso automáticamente
    await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_calcular_fin_acceso()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.role = 'admin' THEN
          NEW.fin_acceso := NULL;
        ELSIF NEW.fin_acceso IS NULL THEN
          NEW.fin_acceso := calcular_fin_acceso(NEW.category, NEW.created_at);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS before_insert_user_fin_acceso ON users;
      CREATE TRIGGER before_insert_user_fin_acceso
      BEFORE INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION trigger_calcular_fin_acceso();
    `);

    await pool.query(`
      UPDATE users SET fin_acceso = NULL WHERE role = 'admin';
    `);

    // Create studios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS studios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        categories TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create time slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
        slot_number INTEGER NOT NULL,
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        slot_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(studio_id, slot_number, slot_date)
      )
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
        time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TIMESTAMP,
        UNIQUE(time_slot_id)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

module.exports = pool;
