-- News Table
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  summary TEXT,
  summary_en TEXT,
  source VARCHAR(255),
  url TEXT,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
