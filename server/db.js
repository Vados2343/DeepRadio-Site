import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'deepradio_db',
  user: process.env.DB_USER || 'deepradio_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🔥 Database connection test:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        station_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, station_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        stat_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        station_id INTEGER NOT NULL,
        station_name VARCHAR(255),
        track_artist VARCHAR(255),
        track_song VARCHAR(255),
        genres TEXT[],
        duration INTEGER NOT NULL,
        timestamp BIGINT NOT NULL,
        liked BOOLEAN DEFAULT FALSE,
        UNIQUE(user_id, timestamp, station_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_gradients (
        gradient_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        gradient_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        setting_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        settings_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    console.log('✅ Database tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
