import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Migrating: Adding performance indexes to database...');
  try {
    // 1. Index on (user_id, played_at_uts DESC)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ecoutes_user_time 
      ON ecoutes (user_id, played_at_uts DESC);
    `);
    console.log('Index idx_ecoutes_user_time created.');

    // 2. Index on (user_id, artist_name)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ecoutes_user_artist 
      ON ecoutes (user_id, artist_name);
    `);
    console.log('Index idx_ecoutes_user_artist created.');

    // 3. Index on (user_id) for friendships just in case
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_friendships_user 
      ON friendships (user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_friend 
      ON friendships (friend_id);
    `);
    console.log('Indexes for friendships created.');

    console.log('All performance indexes applied successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pool.end();
  }
}

migrate();
