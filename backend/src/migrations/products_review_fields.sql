-- 为 products 表添加审核字段
-- 用于支持用户提交 SPU 申请功能

-- 添加审核相关字段
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS submitted_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_note TEXT;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_submitted_by ON products(submitted_by);

-- 添加外键约束
ALTER TABLE products 
ADD CONSTRAINT products_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD CONSTRAINT products_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 注释
COMMENT ON COLUMN products.submitted_by IS '提交人 ID（用户申请时）';
COMMENT ON COLUMN products.reviewed_by IS '审核人 ID';
COMMENT ON COLUMN products.reviewed_at IS '审核时间';
COMMENT ON COLUMN products.review_note IS '审核备注';
COMMENT ON COLUMN products.status IS '状态: PENDING | ACTIVE | INACTIVE | REJECTED';
