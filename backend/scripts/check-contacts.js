const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const zangjiId = 'bdce9f39-77f2-4d24-b05f-387e6926c39b';
  
  // 臧骥的联系人
  const zangjiContacts = await pool.query(`
    SELECT cm.*, u.name, u.email 
    FROM contact_members cm 
    JOIN users u ON cm.contact_user_id = u.id
    WHERE cm.user_id = $1
  `, [zangjiId]);
  console.log('臧骥的联系人:', zangjiContacts.rows.length);
  zangjiContacts.rows.forEach(r => console.log(`  - ${r.name} (${r.email})`));
  
  // 谁的联系人列表里有臧骥
  const hasZangji = await pool.query(`
    SELECT cm.*, u.name, u.email 
    FROM contact_members cm 
    JOIN users u ON cm.user_id = u.id
    WHERE cm.contact_user_id = $1
  `, [zangjiId]);
  console.log('\n谁的联系人列表里有臧骥:', hasZangji.rows.length);
  hasZangji.rows.forEach(r => console.log(`  - ${r.name} (${r.email})`));
  
  // 检查臧骥收到的消息
  const messages = await pool.query(`
    SELECT id, user_id, sender_name, title, folder 
    FROM messages 
    WHERE sender_id = $1 OR recipient_id = $1
    LIMIT 10
  `, [zangjiId]);
  console.log('\n臧骥相关的消息:', messages.rows.length);
  messages.rows.forEach(r => console.log(`  - [${r.folder}] ${r.sender_name}: ${r.title}`));
  
  await pool.end();
}

check();
