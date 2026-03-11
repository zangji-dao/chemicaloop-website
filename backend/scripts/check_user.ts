import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT id, email, token_version FROM users WHERE email = $1',
      ['testuser@example.com']
    );

    console.log('User:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUser();
