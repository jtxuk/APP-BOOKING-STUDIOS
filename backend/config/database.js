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
        initials VARCHAR(4) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        category_start_date DATE,
        fin_acceso DATE,
        activo BOOLEAN DEFAULT true,
        must_change_password BOOLEAN DEFAULT false,
        token_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agregar columnas necesarias para DBs existentes
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
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='must_change_password') THEN
          ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='token_version') THEN
          ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='category_start_date') THEN
          ALTER TABLE users ADD COLUMN category_start_date DATE;
        END IF;
      END $$;
    `);

    // Ampliar initials a 4 y eliminar constraint de formato rígido si existe
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users'
            AND column_name = 'initials'
            AND character_maximum_length = 3
        ) THEN
          ALTER TABLE users
          ALTER COLUMN initials TYPE VARCHAR(4);
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'users'
            AND constraint_name = 'users_initials_format_check'
            AND constraint_type = 'CHECK'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT users_initials_format_check;
        END IF;
      END $$;
    `);

    // Crear o reemplazar función para calcular fin_acceso
    await pool.query(`
      CREATE OR REPLACE FUNCTION calcular_fin_acceso(p_category VARCHAR, p_start_date TIMESTAMP)
      RETURNS DATE AS $$
      DECLARE
        anio_inicio_academico INTEGER;
        duracion INTEGER;
        fecha_corte DATE;
      BEGIN
        -- Año académico con corte en 20 de septiembre
        fecha_corte := MAKE_DATE(EXTRACT(YEAR FROM p_start_date)::INTEGER, 9, 20);
        IF p_start_date::DATE >= fecha_corte THEN
          anio_inicio_academico := EXTRACT(YEAR FROM p_start_date)::INTEGER;
        ELSE
          anio_inicio_academico := EXTRACT(YEAR FROM p_start_date)::INTEGER - 1;
        END IF;
        
        CASE p_category
          WHEN 'PME' THEN duracion := 2;
          WHEN 'EST-SUP' THEN duracion := 2;
          WHEN 'ING' THEN duracion := 1;
          WHEN 'PME+ING' THEN duracion := 3;
          ELSE duracion := 1;
        END CASE;
        
        RETURN MAKE_DATE(anio_inicio_academico + duracion, 9, 20);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger: administra category_start_date y recalcula fin_acceso
    await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_calcular_fin_acceso()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.role = 'admin' THEN
          NEW.category_start_date := NULL;
          NEW.fin_acceso := NULL;
          RETURN NEW;
        END IF;

        IF TG_OP = 'UPDATE' AND NEW.category IS DISTINCT FROM OLD.category THEN
          NEW.category_start_date := CURRENT_DATE;
        END IF;

        IF NEW.category_start_date IS NULL THEN
          IF TG_OP = 'INSERT' THEN
            NEW.category_start_date := COALESCE(NEW.created_at::DATE, CURRENT_DATE);
          ELSE
            NEW.category_start_date := COALESCE(OLD.category_start_date, CURRENT_DATE);
          END IF;
        END IF;

        NEW.fin_acceso := calcular_fin_acceso(NEW.category, NEW.category_start_date::timestamp);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS before_insert_user_fin_acceso ON users;
      DROP TRIGGER IF EXISTS before_upsert_user_fin_acceso ON users;
      CREATE TRIGGER before_upsert_user_fin_acceso
      BEFORE INSERT OR UPDATE OF category, role, category_start_date ON users
      FOR EACH ROW
      EXECUTE FUNCTION trigger_calcular_fin_acceso();
    `);

    // Backfill inicial de category_start_date y recalculo de fin_acceso
    await pool.query(`
      UPDATE users
      SET category_start_date = COALESCE(category_start_date, created_at::DATE)
      WHERE role <> 'admin';
    `);

    await pool.query(`
      UPDATE users
      SET category_start_date = NULL,
          fin_acceso = NULL
      WHERE role = 'admin';
    `);

    await pool.query(`
      UPDATE users
      SET fin_acceso = calcular_fin_acceso(category, category_start_date::timestamp)
      WHERE role <> 'admin';
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
