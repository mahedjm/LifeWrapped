import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const res = await pool.query(`
    SELECT f.*, u1.username as user, u2.username as friend 
    FROM friendships f
    JOIN users u1 ON f.user_id = u1.id
    JOIN users u2 ON f.friend_id = u2.id
    WHERE (u1.username = 'BLGREVENANT' AND u2.username = 'Teguyyyy')
       OR (u1.username = 'Teguyyyy' AND u2.username = 'BLGREVENANT')
  `);
  console.log('--- RELATIONS TROUVÉES ---');
  console.log(res.rows);
  await pool.end();
}
check();
