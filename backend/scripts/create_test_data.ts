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

async function createTestData() {
  try {
    // 获取第一个用户 ID
    const user1Result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['testuser@example.com']
    );

    const user1Id = user1Result.rows[0].id;
    console.log('User 1:', user1Result.rows[0]);

    // 创建第二个用户
    const passwordHash = await bcrypt.hash('test123456', 10);
    const user2Result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = $3
       RETURNING id, email, name, role, verified`,
      ['agent@example.com', passwordHash, 'Agent User', 'AGENT', true]
    );

    const user2Id = user2Result.rows[0].id;
    console.log('User 2:', user2Result.rows[0]);

    // 创建一条测试消息（模拟外部邮件发送给 user2）
    // Inbox 中的邮件都是从外部邮箱服务器下载的，sender_id 应该为 null
    const messageResult = await pool.query(
      `INSERT INTO messages (user_id, type, folder, title, content, sender_id, sender_name, sender_address, recipient_id, recipient_name, recipient_address, status, unread)
       VALUES ($1, 'inquiry', 'inbox', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, user_id, sender_id, recipient_id, title, content, status, created_at`,
      [user2Id, 'Test Inquiry', 'This is a test inquiry for chemical trading.', null, 'Test User', 'test@external-mail.com', user2Id, 'Agent User', 'agent@company.com', 'received', true]
    );

    console.log('Test message:', messageResult.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createTestData();
