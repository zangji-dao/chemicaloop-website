const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * 将中文名转换为拼音或生成安全的邮箱名称
 */
function generateEmailName(name) {
  if (!name) return null;
  
  // 如果是纯英文名，转换为小写并移除特殊字符
  if (/^[a-zA-Z\s]+$/.test(name)) {
    return name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }
  
  // 对于包含非英文字符的名字，生成基于时间戳的唯一标识
  // 这里简单处理，实际应该使用拼音转换库
  const timestamp = Date.now().toString(36);
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `user${hash}${timestamp}`;
}

async function fixInternalEmails() {
  try {
    console.log('🔧 开始修复内网邮箱...\n');

    // 查询所有没有内网邮箱的用户
    const result = await pool.query(`
      SELECT id, name, email, username, internal_email_name, internal_email, role
      FROM users
      WHERE internal_email IS NULL OR internal_email = ''
    `);

    console.log(`发现 ${result.rows.length} 个没有内网邮箱的用户\n`);

    if (result.rows.length === 0) {
      console.log('✅ 所有用户都已有内网邮箱');
      await pool.end();
      return;
    }

    // 为每个用户生成内网邮箱
    for (const user of result.rows) {
      // 优先使用 name，其次使用 username，最后使用 email 前缀
      let emailName = user.name || user.username || user.email?.split('@')[0];
      
      if (!emailName) {
        console.log(`  ⚠️ 跳过用户 ${user.id}：无法生成邮箱名称`);
        continue;
      }

      // 生成安全的邮箱名称
      const safeEmailName = generateEmailName(emailName);
      
      if (!safeEmailName) {
        console.log(`  ⚠️ 跳过用户 ${user.id}：无法生成安全的邮箱名称`);
        continue;
      }

      // 检查邮箱名称是否已存在
      const existingCheck = await pool.query(
        'SELECT id FROM users WHERE internal_email_name = $1 AND id != $2',
        [safeEmailName, user.id]
      );

      let finalEmailName = safeEmailName;
      if (existingCheck.rows.length > 0) {
        // 如果已存在，添加数字后缀
        const baseName = safeEmailName;
        let suffix = 1;
        while (existingCheck.rows.length > 0) {
          finalEmailName = `${baseName}${suffix}`;
          const checkAgain = await pool.query(
            'SELECT id FROM users WHERE internal_email_name = $1 AND id != $2',
            [finalEmailName, user.id]
          );
          if (checkAgain.rows.length === 0) break;
          suffix++;
        }
      }

      const internalEmail = `${finalEmailName}@chemicaloop`;

      // 更新用户
      await pool.query(
        `UPDATE users 
         SET internal_email_name = $1, internal_email = $2, updated_at = NOW()
         WHERE id = $3`,
        [finalEmailName, internalEmail, user.id]
      );

      console.log(`  ✓ ${user.name || user.email}`);
      console.log(`    原名: ${user.name}`);
      console.log(`    内网邮箱: ${internalEmail}`);
      console.log('');
    }

    console.log('✅ 内网邮箱修复完成！');

    // 验证结果
    const verify = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE internal_email IS NULL OR internal_email = ''
    `);
    console.log(`\n剩余没有内网邮箱的用户: ${verify.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixInternalEmails();
