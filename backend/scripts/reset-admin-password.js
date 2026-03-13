const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetPassword() {
  console.log('=== 重置 Admin 用户密码 ===');
  
  const newPassword = '123456';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  console.log('生成密码哈希...');
  
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE email = $2`,
    [passwordHash, 'admin@chemicaloop.com']
  );
  
  console.log('✅ 密码已重置');
  console.log('');
  console.log('=== 登录信息 ===');
  console.log('邮箱: admin@chemicaloop.com');
  console.log('密码: 123456');
  console.log('角色: ADMIN');
  
  await pool.end();
}

resetPassword().catch(console.error);
