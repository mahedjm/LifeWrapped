import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Since we are running this script directly from the root context usually,
// we ensure we pick up .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Starting DB initialization on PostgreSQL...');
  try {
    await pool.query(`
      DROP TABLE IF EXISTS ecoutes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS artistes CASCADE;
      DROP TABLE IF EXISTS pistes CASCADE;
      DROP TABLE IF EXISTS auth CASCADE;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        invite_code TEXT,
        session_key TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ecoutes (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        track_name TEXT,
        artist_name TEXT,
        album_name TEXT,
        duration_ms INTEGER,
        played_at_uts INTEGER,
        image_url TEXT,
        UNIQUE(user_id, track_name, artist_name, played_at_uts)
      );

      CREATE TABLE IF NOT EXISTS artistes (
        name TEXT PRIMARY KEY,
        image_url TEXT,
        genres TEXT
      );

      CREATE TABLE IF NOT EXISTS pistes (
        artist_name TEXT,
        track_name TEXT,
        duration_ms INTEGER,
        PRIMARY KEY(artist_name, track_name)
      );

      CREATE TABLE IF NOT EXISTS auth (
        id_key TEXT PRIMARY KEY,
        id_value TEXT
      );
    `);
    console.log('Tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    pool.end();
  }
}

main();
