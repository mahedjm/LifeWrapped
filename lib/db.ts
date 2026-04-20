import { Pool } from 'pg';

const globalForPg = global as unknown as { pool: Pool };

export const db = globalForPg.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') globalForPg.pool = db;

export default db;
