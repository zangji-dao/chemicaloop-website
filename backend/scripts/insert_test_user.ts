import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function insertTestUser() {
  try {
    // 检查用户是否已存在
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['testuser@example.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('User already exists:', existingUser.rows[0]);
      return;
    }

    // 创建测试用户
    const passwordHash = await bcrypt.hash('test123456', 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, verified`,
      ['testuser@example.com', passwordHash, 'Test User', 'USER', true]
    );

    console.log('Test user created:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

insertTestUser();
