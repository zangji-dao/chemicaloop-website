const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function seedDatabase() {
  try {
    console.log('🌱 开始种子数据初始化...\n');

    // 密码统一为 123456
    const passwordHash = await bcrypt.hash('123456', 10);

    // ============================================
    // 1. 创建/更新测试用户
    // ============================================
    console.log('📝 创建测试用户...');

    const testUsers = [
      {
        id: 'c4ca4238-a0b9-2382-0dcc-509a6f75849b',
        email: 'normaluser@example.com',
        name: 'normaluser',
        username: 'normaluser',
        internalEmail: 'normaluser@chemicaloop',
        role: 'USER'
      },
      {
        id: '4cdd95e5-aa60-4383-baa4-25351f16ddc8',
        email: 'agent@example.com',
        name: 'agentuser2',
        username: 'agentuser2',
        internalEmail: 'agentuser2@chemicaloop',
        role: 'AGENT'
      },
      {
        id: 'bdce9f39-77f2-4d24-b05f-387e6926c39b',
        email: 'zang.jim@gmail.com',
        name: '臧骥',
        username: '234',
        internalEmail: '234@chemicaloop',
        role: 'USER'
      }
    ];

    for (const user of testUsers) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, username, internal_email_name, internal_email, role, verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           username = EXCLUDED.username,
           internal_email_name = EXCLUDED.internal_email_name,
           internal_email = EXCLUDED.internal_email,
           verified = EXCLUDED.verified`,
        [user.id, user.email, passwordHash, user.name, user.username, user.username, user.internalEmail, user.role, true]
      );
      console.log(`  ✓ ${user.name} (${user.internalEmail})`);
    }

    // ============================================
    // 2. 创建联系人关系
    // ============================================
    console.log('\n📝 创建联系人关系...');

    const normaluserId = 'c4ca4238-a0b9-2382-0dcc-509a6f75849b';

    // 获取已有用户作为联系人
    const existingUsers = await pool.query(`
      SELECT id, name, internal_email FROM users 
      WHERE id != $1 AND internal_email IS NOT NULL
      LIMIT 10
    `, [normaluserId]);

    for (const contact of existingUsers.rows) {
      await pool.query(
        `INSERT INTO contact_members (id, user_id, contact_user_id, contact_details, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          normaluserId,
          contact.id,
          JSON.stringify({ wechat: `wx_${contact.name}`, whatsapp: '+123456789' })
        ]
      );
      console.log(`  ✓ ${contact.name} (${contact.internal_email}) -> normaluser 的联系人`);
    }

    // ============================================
    // 3. 创建联系人请求
    // ============================================
    console.log('\n📝 创建联系人请求...');

    // 清理旧的测试请求
    await pool.query(`DELETE FROM contact_requests WHERE requester_id = $1 OR receiver_id = $1`, [normaluserId]);

    // 收到的请求（其他人向 normaluser 请求）
    const requesters = existingUsers.rows.slice(0, 3);
    for (let i = 0; i < requesters.length; i++) {
      const requester = requesters[i];
      await pool.query(
        `INSERT INTO contact_requests (
          id, requester_id, receiver_id, message_id,
          requested_contact_ids, requester_shared_contacts,
          message, status, created_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          requester.id,
          normaluserId,
          `msg-test-received-${i}`,
          JSON.stringify(['wechat', 'whatsapp']),
          JSON.stringify({ wechat: `wx_${requester.name}`, whatsapp: `+123456${i}` }),
          `您好，我想与您交换联系方式。 - ${requester.name}`,
          'pending'
        ]
      );
      console.log(`  ✓ ${requester.name} (${requester.internal_email}) -> normaluser [收到的请求]`);
    }

    // 发送的请求（normaluser 向其他人请求）
    const receivers = existingUsers.rows.slice(3, 6);
    for (let i = 0; i < receivers.length; i++) {
      const receiver = receivers[i];
      await pool.query(
        `INSERT INTO contact_requests (
          id, requester_id, receiver_id, message_id,
          requested_contact_ids, requester_shared_contacts,
          message, status, created_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          normaluserId,
          receiver.id,
          `msg-test-sent-${i}`,
          JSON.stringify(['wechat', 'email']),
          JSON.stringify({ wechat: 'normaluser_wx', email: 'normaluser@chemicaloop' }),
          `您好，希望能与您交换联系方式。`,
          'pending'
        ]
      );
      console.log(`  ✓ normaluser -> ${receiver.name} (${receiver.internal_email}) [发送的请求]`);
    }

    // ============================================
    // 4. 验证结果
    // ============================================
    console.log('\n✅ 种子数据创建完成！\n');

    const contacts = await pool.query(`
      SELECT u.name, u.internal_email FROM contact_members cm
      JOIN users u ON cm.contact_user_id = u.id
      WHERE cm.user_id = $1
    `, [normaluserId]);
    console.log(`normaluser 的联系人: ${contacts.rows.length} 个`);
    contacts.rows.forEach(c => console.log(`  - ${c.name} <${c.internal_email}>`));

    const received = await pool.query(`
      SELECT u.name, u.internal_email FROM contact_requests cr
      JOIN users u ON cr.requester_id = u.id
      WHERE cr.receiver_id = $1 AND cr.status = 'pending'
    `, [normaluserId]);
    console.log(`\nnormaluser 收到的请求: ${received.rows.length} 个`);
    received.rows.forEach(r => console.log(`  - ${r.name} <${r.internal_email}>`));

    const sent = await pool.query(`
      SELECT u.name, u.internal_email FROM contact_requests cr
      JOIN users u ON cr.receiver_id = u.id
      WHERE cr.requester_id = $1 AND cr.status = 'pending'
    `, [normaluserId]);
    console.log(`\nnormaluser 发送的请求: ${sent.rows.length} 个`);
    sent.rows.forEach(r => console.log(`  - -> ${r.name} <${r.internal_email}>`));

    console.log('\n📊 测试账号信息:');
    console.log('  normaluser@example.com / 123456');
    console.log('  agent@example.com / 123456');

    await pool.end();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
