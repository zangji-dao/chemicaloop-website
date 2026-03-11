-- Messages Table (站内信和草稿)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 消息类型: 'inquiry' (询价), 'reply' (回复), 'system' (系统消息)
  type VARCHAR(20) NOT NULL DEFAULT 'inquiry',
  
  -- 消息文件夹: 'inbox', 'sent', 'drafts', 'trash', 'archive'
  folder VARCHAR(20) NOT NULL DEFAULT 'inbox',
  
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  
  -- 发送者信息
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name VARCHAR(255),
  sender_address VARCHAR(255),
  
  -- 接收者信息
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_name VARCHAR(255),
  recipient_address VARCHAR(255),
  
  -- 关联的产品信息（询价消息）
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  cas VARCHAR(100),
  quantity VARCHAR(100),
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' (草稿), 'sent', 'received'
  unread BOOLEAN DEFAULT true,
  starred BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  
  -- 回复信息
  reply_content TEXT,
  reply_from VARCHAR(255),
  reply_address VARCHAR(255),
  reply_contact JSONB,
  
  -- 时间戳
  auto_saved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_folder ON messages(folder);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(unread);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
