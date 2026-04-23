import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testRequest() {
  try {
    // 1. Trouver TON utilisateur via le .env.local
    const targetUsername = process.env.LASTFM_USERNAME;
    const meRes = await pool.query('SELECT id, username FROM users WHERE username = $1', [targetUsername]);
    
    if (meRes.rows.length === 0) {
      console.log(`Erreur: L'utilisateur ${targetUsername} n'existe pas en base. Connecte-toi d'abord sur Echo.`);
      return;
    }
    const myId = meRes.rows[0].id;
    const myName = meRes.rows[0].username;

    console.log(`Cible du test : ${myName} (${myId})`);

    // 2. Créer un utilisateur fictif "Testeur" s'il n'existe pas
    const testerName = 'LastFm_Tester';
    const testerId = '00000000-0000-0000-0000-000000000001';
    
    await pool.query(`
      INSERT INTO users (id, username, created_at) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (id) DO NOTHING
    `, [testerId, testerName]);

    // 3. Créer la demande d'ami "pending"
    await pool.query(`
      INSERT INTO friendships (user_id, friend_id, status) 
      VALUES ($1, $2, 'pending')
      ON CONFLICT DO NOTHING
    `, [testerId, myId]);

    // 4. Créer la notification pour TOI
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, from_user_id)
      VALUES ($1, 'friend_request', 'Demande d''ami', $2, $3)
    `, [myId, `${testerName} souhaite devenir ami avec vous !`, testerId]);

    console.log('✅ Demande de test envoyée !');
    console.log('Regarde maintenant ta cloche de notifications sur Echo.');

  } catch (err) {
    console.error('Erreur lors du test:', err);
  } finally {
    await pool.end();
  }
}

testRequest();
