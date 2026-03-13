const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // 每个用户的联系人数量
  const contactCounts = await pool.query(`
    SELECT u.id, u.email, u.name, COUNT(cm.id) as contact_count
    FROM users u
    LEFT JOIN contact_members cm ON u.id = cm.user_id
    GROUP BY u.id, u.email, u.name
    HAVING COUNT(cm.id) > 0
    ORDER BY contact_count DESC
  `);
  console.log('用户联系人数量:');
  contactCounts.rows.forEach(r => console.log(`  ${r.name} (${r.email}): ${r.contact_count} 个联系人`));
  
  // contact_members 表总记录数
  const total = await pool.query(`SELECT COUNT(*) FROM contact_members`);
  console.log('\ncontact_members 表总记录数:', total.rows[0].count);
  
  // 检查臧骥用户详情
  const zangji = await pool.query(`SELECT * FROM users WHERE id = 'bdce9f39-77f2-4d24-b05f-387e6926c39b'`);
  console.log('\n臧骥用户详情:', zangji.rows[0]);
  
  await pool.end();
}

check();
