import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Updating friendships and creating notifications table...');
  try {
    // 1. Ajouter la colonne status à friendships
    await pool.query(`
      ALTER TABLE friendships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    `);

    // 2. Créer la table notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        message TEXT,
        status TEXT DEFAULT 'unread',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
