import pool from '../src/db/db';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: rename username to internal_email_name...');
    
    await client.query('BEGIN');
    
    // 1. 重命名列
    console.log('Renaming column username to internal_email_name...');
    await client.query('ALTER TABLE users RENAME COLUMN username TO internal_email_name');
    
    // 2. 更新索引
    console.log('Updating index...');
    await client.query('DROP INDEX IF EXISTS idx_users_username');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_internal_email_name ON users(internal_email_name)');
    
    // 3. 添加注释
    await client.query(`COMMENT ON COLUMN users.internal_email_name IS '内网邮箱地址名称，一旦设置不可修改'`);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
    // 验证
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'internal_email_name'
    `);
    console.log('Verification:', result.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
