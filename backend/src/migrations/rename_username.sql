-- 重命名 username 为 internal_email_name
-- 内网邮箱地址名称（不可修改）
-- internal_email = internal_email_name + @chemicaloop

-- 1. 重命名列
ALTER TABLE users RENAME COLUMN username TO internal_email_name;

-- 2. 更新唯一约束名称
DROP INDEX IF EXISTS idx_users_username;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_internal_email_name ON users(internal_email_name);

-- 3. 添加注释
COMMENT ON COLUMN users.internal_email_name IS '内网邮箱地址名称，一旦设置不可修改。internal_email = internal_email_name@chemicaloop';
