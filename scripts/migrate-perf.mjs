import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Running performance migrations...');
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ecoutes_user_id ON ecoutes(user_id);
      CREATE INDEX IF NOT EXISTS idx_ecoutes_played_at_uts ON ecoutes(played_at_uts);
      CREATE INDEX IF NOT EXISTS idx_ecoutes_user_time ON ecoutes(user_id, played_at_uts);
    `);
    console.log('Indexes created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
