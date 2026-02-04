-- Chemicaloop Website 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS chemicaloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chemicaloop;

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '产品名称',
  description TEXT COMMENT '产品描述',
  category VARCHAR(100) COMMENT '产品分类',
  price DECIMAL(10, 2) COMMENT '产品价格',
  image_url VARCHAR(500) COMMENT '产品图片URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表';

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '新闻标题',
  content TEXT COMMENT '新闻内容',
  author VARCHAR(100) COMMENT '作者',
  publish_date DATE COMMENT '发布日期',
  image_url VARCHAR(500) COMMENT '新闻图片URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_publish_date (publish_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新闻表';

-- 联系表
CREATE TABLE IF NOT EXISTS contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  email VARCHAR(255) NOT NULL COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '电话',
  message TEXT COMMENT '留言内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系表';

-- 插入示例数据
INSERT INTO products (name, description, category, price, image_url) VALUES
('Agrochemicals', 'High-quality agrochemicals for crop protection', 'Agrochemicals', 1250.00, '/assets/products/agrochemicals.jpg'),
('Performance Chemicals', 'Advanced performance chemicals for industrial use', 'Performance Chemicals', 890.00, '/assets/products/performance.jpg'),
('Food Ingredients', 'Safe and high-quality food additives', 'Food & Healthcare', 650.00, '/assets/products/food.jpg'),
('Pharmaceuticals', 'Pharmaceutical-grade chemicals', 'Pharmaceuticals', 2100.00, '/assets/products/pharma.jpg');

INSERT INTO news (title, content, author, publish_date) VALUES
('Chemicaloop Launches New Product Line', 'We are excited to announce our new line of performance chemicals designed for industrial applications.', 'Admin', CURDATE()),
('Expanding Global Reach', 'Chemicaloop continues to expand its presence in international markets.', 'Marketing Team', DATE_SUB(CURDATE(), INTERVAL 7 DAY));

-- 查看表结构
SHOW TABLES;

-- 显示产品数量
SELECT 'Products count:' AS info, COUNT(*) AS count FROM products;
SELECT 'News count:' AS info, COUNT(*) AS count FROM news;
