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

async function checkMessages() {
  try {
    const result = await pool.query(
      'SELECT id, user_id, title, content, type, folder, status, created_at FROM messages ORDER BY created_at DESC LIMIT 20'
    );

    console.log('Messages count:', result.rows.length);
    console.log('Messages:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkMessages();
