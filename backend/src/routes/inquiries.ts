import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, agentOnlyMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create inquiry
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { productId, quantity, targetPrice, message } = req.body;

  if (!productId || !quantity || !message) {
    return res.status(400).json({ success: false, error: 'Product ID, quantity, and message are required' });
  }

  try {
    // Check if product exists
    const productCheck = await pool.query('SELECT id, name, name_en FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = productCheck.rows[0];

    // Get user's agent (from agent_links if they came via referral link)
    let agentId = null;
    const agentCheck = await pool.query(
      'SELECT agent_id FROM agent_links WHERE agent_id = (SELECT id FROM users WHERE id = $1)',
      [req.userId]
    );

    if (agentCheck.rows.length > 0) {
      agentId = agentCheck.rows[0].agent_id;
    } else {
      // Send to platform's direct agent
      const platformAgent = await pool.query(
        "SELECT id FROM users WHERE role = 'OPERATOR' LIMIT 1"
      );
      if (platformAgent.rows.length > 0) {
        agentId = platformAgent.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO inquiries (user_id, product_id, quantity, target_price, message, agent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, productId, Number(quantity), targetPrice || null, message, agentId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create inquiry' });
  }
});

// Get user's inquiries
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT i.*, p.name as product_name, p.name_en as product_name_en, p.image_url as product_image_url,
             u.name as user_name, u.email as user_email
      FROM inquiries i
      JOIN products p ON i.product_id = p.id
      JOIN users u ON i.user_id = u.id
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Regular users can only see their own inquiries
    if (req.userRole !== 'AGENT' && req.userRole !== 'ADMIN' && req.userRole !== 'OPERATOR') {
      paramCount++;
      query += ` WHERE i.user_id = $${paramCount}`;
      params.push(req.userId);
    } else {
      // Agents can see inquiries assigned to them
      paramCount++;
      query += ` WHERE i.agent_id = $${paramCount}`;
      params.push(req.userId);
    }

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ success: false, error: 'Failed to get inquiries' });
  }
});

// Reply to inquiry (agent only)
router.put('/:id/reply', authMiddleware, agentOnlyMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (!response) {
    return res.status(400).json({ success: false, error: 'Response is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE inquiries
       SET agent_response = $1, status = 'REPLIED', replied_at = NOW(), agent_id = $2
       WHERE id = $3
       RETURNING *`,
      [response, req.userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Reply inquiry error:', error);
    res.status(500).json({ success: false, error: 'Failed to reply inquiry' });
  }
});

// Get user stats
router.get('/stats/summary', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_inquiries,
         COUNT(*) FILTER (WHERE status = 'PENDING') as pending_inquiries,
         COUNT(*) FILTER (WHERE status = 'REPLIED') as replied_inquiries
       FROM inquiries
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export default router;
