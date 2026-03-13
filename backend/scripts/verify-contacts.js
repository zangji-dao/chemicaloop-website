const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user_7604443655382024211:c3e80e89-5034-4404-b4b6-44a66c4ce9d6@cp-valid-flake-22c4b76e.pg4.aidap-global.cn-beijing.volces.com:5432/Database_1770552714254?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const zangjiId = 'bdce9f39-77f2-4d24-b05f-387e6926c39b';
  
  // 直接查询数据库验证
  const result = await pool.query(`
    SELECT cm.contact_user_id, u.name, u.email, u.role, cm.created_at
    FROM contact_members cm
    JOIN users u ON cm.contact_user_id = u.id
    WHERE cm.user_id = $1
    ORDER BY cm.created_at DESC
  `, [zangjiId]);
  
  console.log('臧骥的联系人 (数据库直接查询):');
  console.log('总计:', result.rows.length, '个联系人');
  result.rows.slice(0, 5).forEach(r => {
    console.log(`  - ${r.name} (${r.email})`);
  });
  if (result.rows.length > 5) {
    console.log(`  ... 还有 ${result.rows.length - 5} 个联系人`);
  }
  
  await pool.end();
}

verify();
