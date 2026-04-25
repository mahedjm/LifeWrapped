import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Migrating: Adding user_badges table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        badge_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id, level)
      );
    `);
    console.log('Table user_badges created successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pool.end();
  }
}

migrate();
