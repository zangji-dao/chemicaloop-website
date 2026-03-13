const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function seedContacts() {
  const zangjiId = 'bdce9f39-77f2-4d24-b05f-387e6926c39b';
  
  // 获取其他用户作为联系人
  const users = await pool.query(`
    SELECT id, email, name FROM users 
    WHERE id != $1 
    ORDER BY created_at
  `, [zangjiId]);
  
  console.log('可添加为联系人的用户:');
  users.rows.forEach(u => console.log(`  ${u.name} (${u.email}): ${u.id}`));
  
  // 为臧骥添加联系人
  const now = new Date();
  for (let i = 0; i < users.rows.length; i++) {
    const contact = users.rows[i];
    try {
      await pool.query(`
        INSERT INTO contact_members (id, user_id, contact_user_id, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $3)
        ON CONFLICT DO NOTHING
      `, [zangjiId, contact.id, now]);
      console.log(`\n已添加联系人: ${contact.name}`);
    } catch (err) {
      console.log(`\n添加联系人失败: ${contact.name} - ${err.message}`);
    }
  }
  
  // 验证
  const result = await pool.query(`
    SELECT cm.*, u.name as contact_name, u.email as contact_email
    FROM contact_members cm
    JOIN users u ON cm.contact_user_id = u.id
    WHERE cm.user_id = $1
  `, [zangjiId]);
  
  console.log('\n臧骥的联系人列表:');
  result.rows.forEach(r => console.log(`  - ${r.contact_name} (${r.contact_email})`));
  console.log(`\n总计: ${result.rows.length} 个联系人`);
  
  await pool.end();
}

seedContacts();
