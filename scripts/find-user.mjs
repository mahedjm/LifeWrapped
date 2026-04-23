import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function find() {
  const res = await pool.query("SELECT username FROM users WHERE username ILIKE 'teguy%'");
  console.log(res.rows);
  await pool.end();
}
find();
