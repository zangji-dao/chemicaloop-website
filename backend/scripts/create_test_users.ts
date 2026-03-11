import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

// 创建测试用户
// 注意：email 是注册邮箱（外网邮箱），internal_email 是系统生成的内网邮箱（@chemicaloop）
const testUsers = [
  { name: 'John Smith', email: 'john.smith@example.com', role: 'AGENT', language: 'en', country: 'USA' },
  { name: '张三', email: 'zhangsan@example.com', role: 'AGENT', language: 'zh', country: 'China' },
  { name: '田中太郎', email: 'tanaka@example.com', role: 'AGENT', language: 'ja', country: 'Japan' },
  { name: '김철수', email: 'kim.cheolsu@example.com', role: 'AGENT', language: 'ko', country: 'Korea' },
  { name: 'Hans Müller', email: 'hans.mueller@example.com', role: 'AGENT', language: 'de', country: 'Germany' },
  { name: 'Pierre Dupont', email: 'pierre.dupont@example.com', role: 'AGENT', language: 'fr', country: 'France' },
  { name: 'María García', email: 'maria.garcia@example.com', role: 'AGENT', language: 'es', country: 'Spain' },
  { name: 'João Silva', email: 'joao.silva@example.com', role: 'AGENT', language: 'pt', country: 'Brazil' },
  { name: 'Иван Петров', email: 'ivan.petrov@example.com', role: 'AGENT', language: 'ru', country: 'Russia' },
  { name: 'محمد أحمد', email: 'mohammed.ahmed@example.com', role: 'AGENT', language: 'ar', country: 'UAE' },
];

// 消息到用户的映射
const messageToUserMap = {
  'msg-en-short-1': 'john.smith@example.com',
  'msg-zh-short-1': 'zhangsan@example.com',
  'msg-ja-short-1': 'tanaka@example.com',
  'msg-ko-short-1': 'kim.cheolsu@example.com',
  'msg-de-short-1': 'hans.mueller@example.com',
  'msg-fr-short-1': 'pierre.dupont@example.com',
  'msg-es-short-1': 'maria.garcia@example.com',
  'msg-pt-short-1': 'joao.silva@example.com',
  'msg-ru-short-1': 'ivan.petrov@example.com',
  'msg-ar-short-1': 'mohammed.ahmed@example.com',
  'msg-en-medium-1': 'john.smith@example.com',
  'msg-zh-medium-1': 'zhangsan@example.com',
  'msg-ja-medium-1': 'tanaka@example.com',
  'msg-ko-medium-1': 'kim.cheolsu@example.com',
  'msg-de-medium-1': 'hans.mueller@example.com',
  'msg-fr-medium-1': 'pierre.dupont@example.com',
};

async function createTestUsers() {
  const saltRounds = 10;
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, saltRounds);

  console.log('=== Creating Test Users ===');

  for (const user of testUsers) {
    try {
      // 检查用户是否已存在
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`✓ User already exists: ${user.name} (${user.email})`);
        continue;
      }

      // 创建新用户
      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role, verified)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true)
         RETURNING id, email, name`,
        [user.email, passwordHash, user.name, user.role]
      );

      console.log(`✓ Created user: ${result.rows[0].name} (${result.rows[0].email})`);
    } catch (error) {
      console.error(`✗ Failed to create user ${user.email}:`, error);
    }
  }
}

async function updateMessages() {
  console.log('\n=== Updating Messages ===');

  for (const [messageId, email] of Object.entries(messageToUserMap)) {
    try {
      // 获取用户信息
      const userResult = await pool.query(
        'SELECT name FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        console.log(`✗ User not found for message ${messageId}: ${email}`);
        continue;
      }

      const userName = userResult.rows[0].name;

      // 更新消息的发送者信息
      const result = await pool.query(
        `UPDATE messages
         SET sender_name = $1, sender_address = $2
         WHERE id = $3
         RETURNING id, title, sender_name, sender_address`,
        [userName, email, messageId]
      );

      if (result.rows.length > 0) {
        console.log(`✓ Updated message ${messageId}: ${result.rows[0].title} <- ${userName} (${email})`);
      }
    } catch (error) {
      console.error(`✗ Failed to update message ${messageId}:`, error);
    }
  }
}

async function main() {
  try {
    await createTestUsers();
    await updateMessages();

    console.log('\n=== Summary ===');
    console.log('✓ Test users created/verified');
    console.log('✓ Messages updated with real user emails');
    console.log('\nYou can now test the social contact exchange feature!');
    console.log('\nLogin credentials for test users:');
    console.log('Email: any of the above emails');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
