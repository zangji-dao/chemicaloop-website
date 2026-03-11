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

async function updateMessages() {
  try {
    // 将所有消息的 user_id 更新为当前测试用户的 user_id
    const result = await pool.query(
      `UPDATE messages 
       SET user_id = $1 
       WHERE user_id = $2
       RETURNING id, title, user_id`,
      ['46635c24-ea12-4b4c-80ec-ee960d51b83a', 'c4ca4238-a0b9-2382-0dcc-509a6f75849b']
    );

    console.log('Updated messages count:', result.rows.length);
    console.log('Updated messages:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updateMessages();
