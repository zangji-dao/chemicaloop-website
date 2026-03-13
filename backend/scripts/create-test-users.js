const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// 使用环境变量中的数据库 URL
const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestUsers() {
  try {
    // 密码哈希
    const passwordHash = await bcrypt.hash('password123', 10);

    console.log('Creating test users...');

    // 创建普通用户 - 使用 UPSERT 处理 email 或 internal_email 冲突
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, username, internal_email, role, verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (internal_email) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         verified = EXCLUDED.verified,
         id = EXCLUDED.id`,
      [
        'c4ca4238-a0b9-2382-0dcc-509a6f75849b', // UUID (标准格式)
        'normaluser@example.com', // 注册邮箱（外网邮箱）
        passwordHash,
        'normaluser', // name = username
        'normaluser', // username
        'normaluser@chemicaloop', // internal_email（内网邮箱）
        'USER',
        true
      ]
    );

    // 创建代理用户
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, username, internal_email, role, verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (internal_email) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         verified = EXCLUDED.verified,
         id = EXCLUDED.id`,
      [
        'c81e728d-9d4c-2f63-6f06-7f89cc14862c', // UUID (标准格式)
        'agent@example.com', // 注册邮箱（外网邮箱）
        passwordHash,
        'agentuser', // name = username
        'agentuser', // username
        'agentuser@chemicaloop', // internal_email（内网邮箱）
        'AGENT',
        true
      ]
    );

    // 验证创建结果
    const result = await pool.query(
      `SELECT id, email, name, username, internal_email, role, verified FROM users WHERE email IN ($1, $2)`,
      ['normaluser@example.com', 'agent@example.com']
    );

    console.log('\n✅ Test users created successfully:');
    result.rows.forEach(user => {
      console.log(`\n${user.role}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Internal Email: ${user.internal_email}`);
      console.log(`  Password: password123`);
      console.log(`  Verified: ${user.verified}`);
      console.log(`  User ID: ${user.id}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
