import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('analytics.db');
const rows = db.prepare('SELECT track_name, artist_name, COUNT(*) as count FROM ecoutes WHERE played_at_uts >= strftime("%s", "now", "-2 days") GROUP BY track_name, artist_name ORDER BY count DESC LIMIT 5').all();
console.log('Top 48h:', JSON.stringify(rows, null, 2));
db.close();
