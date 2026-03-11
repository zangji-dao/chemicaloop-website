import express from 'express';
import pool from '../db/db';
import { authMiddleware, agentOnlyMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 抓取新闻（模拟数据，实际可以接入真实API）
router.post('/scrape', authMiddleware, agentOnlyMiddleware, async (req: AuthRequest, res) => {
  try {
    // 这里可以接入真实的新闻API或爬虫
    // 暂时使用模拟数据

    const mockNews = [
      {
        title: "Global Chemical Market Forecast 2024: Growth and Trends",
        titleEn: "Global Chemical Market Forecast 2024: Growth and Trends",
        category: "MARKET",
        summary: "The global chemical market is projected to reach $5.3 trillion by 2024, driven by increasing demand from end-use industries such as automotive, construction, and healthcare.",
        summaryEn: "The global chemical market is projected to reach $5.3 trillion by 2024, driven by increasing demand from end-use industries.",
        source: "Chemical Market Insights",
        url: "https://example.com/news/1",
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
        publishedAt: new Date(),
      },
      {
        title: "BASF Expands Production Capacity for Specialty Chemicals in Asia",
        titleEn: "BASF Expands Production Capacity for Specialty Chemicals in Asia",
        category: "COMPANY",
        summary: "BASF announces significant investment to expand specialty chemicals production capacity in China and India to meet growing regional demand.",
        summaryEn: "BASF announces significant investment to expand specialty chemicals production capacity in China and India.",
        source: "BASF News",
        url: "https://example.com/news/2",
        imageUrl: "https://images.unsplash.com/photo-1563218126-a4273aed2016?w=800",
        publishedAt: new Date(Date.now() - 86400000),
      },
      {
        title: "Green Chemistry Innovations: New Sustainable Manufacturing Processes",
        titleEn: "Green Chemistry Innovations: New Sustainable Manufacturing Processes",
        category: "TECHNOLOGY",
        summary: "Researchers develop new catalytic processes that reduce energy consumption and waste in chemical production, marking a breakthrough in green chemistry.",
        summaryEn: "Researchers develop new catalytic processes that reduce energy consumption and waste in chemical production.",
        source: "Science Daily",
        url: "https://example.com/news/3",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
        publishedAt: new Date(Date.now() - 172800000),
      },
      {
        title: "China Chemical Exports Surge 25% in Q3 2024",
        titleEn: "China Chemical Exports Surge 25% in Q3 2024",
        category: "TRADE",
        summary: "China's chemical exports reached record high in Q3 2024, with strong demand from Southeast Asia and Europe driving growth.",
        summaryEn: "China's chemical exports reached record high in Q3 2024, with strong demand from Southeast Asia and Europe.",
        source: "China Chemical News",
        url: "https://example.com/news/4",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
        publishedAt: new Date(Date.now() - 259200000),
      },
      {
        title: "New Regulations on Chemical Waste Management in Europe",
        titleEn: "New Regulations on Chemical Waste Management in Europe",
        category: "REGULATION",
        summary: "EU implements stricter regulations on chemical waste management, requiring manufacturers to adopt sustainable disposal practices.",
        summaryEn: "EU implements stricter regulations on chemical waste management, requiring manufacturers to adopt sustainable disposal practices.",
        source: "EU Regulatory News",
        url: "https://example.com/news/5",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        publishedAt: new Date(Date.now() - 345600000),
      },
    ];

    // 插入数据库
    let insertedCount = 0;
    for (const news of mockNews) {
      // 检查是否已存在
      const exists = await pool.query(
        'SELECT id FROM news WHERE title = $1 OR url = $2',
        [news.title, news.url]
      );

      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO news (title, title_en, category, summary, summary_en, source, url, image_url, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            news.title,
            news.titleEn,
            news.category,
            news.summary,
            news.summaryEn,
            news.source,
            news.url,
            news.imageUrl,
            news.publishedAt,
          ]
        );
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully scraped ${insertedCount} new articles`,
      data: { insertedCount },
    });
  } catch (error: any) {
    console.error('Scrape news error:', error);
    res.status(500).json({ success: false, error: 'Failed to scrape news' });
  }
});

// 获取新闻列表
router.get('/', async (req, res) => {
  const { category, limit = 20, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM news WHERE status = $1';
    const params: any[] = ['ACTIVE'];
    let paramCount = 1;

    if (category && category !== 'ALL') {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY published_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get news error:', error);
    res.status(500).json({ success: false, error: 'Failed to get news' });
  }
});

// 删除新闻
router.delete('/:id', authMiddleware, agentOnlyMiddleware, async (req: AuthRequest, res) => {
  try {
    await pool.query('UPDATE news SET status = $1 WHERE id = $2', ['DELETED', req.params.id]);

    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error: any) {
    console.error('Delete news error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete news' });
  }
});

export default router;
