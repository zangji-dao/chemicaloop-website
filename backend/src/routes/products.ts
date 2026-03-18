import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, agentOnlyMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT p.id, p.cas, p.name, p.name_en, p.formula, p.description, p.image_url, p.status, p.hs_code
      FROM products p
      WHERE p.status = 'ACTIVE'
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.name_en ILIKE $${paramCount} OR p.cas ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    paramCount++;
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// Get suppliers by CAS code
router.get('/:cas/suppliers', async (req, res) => {
  const { cas } = req.params;

  if (!cas) {
    return res.status(400).json({ success: false, error: '请提供CAS码' });
  }

  try {
    // 使用子查询获取每个产品的唯一记录，避免 JOIN 导致的重复
    const result = await pool.query(
      `SELECT DISTINCT ON (ap.id)
        ap.id as product_id,
        ap.cas,
        ap.name,
        ap.purity,
        ap.package_spec,
        ap.price,
        ap.min_order,
        ap.stock,
        ap.stock_public,
        ap.origin,
        u.id as agent_id,
        u.name as agent_name,
        u.username as agent_username,
        up.country,
        up.city,
        up.wechat,
        up.whatsapp,
        up.telegram,
        up.messenger,
        up.line,
        up.viber
      FROM agent_products ap
      JOIN users u ON ap.agent_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ap.cas = $1
        AND ap.status = 'active'
      ORDER BY ap.id, ap.price ASC NULLS LAST`,
      [cas]
    );

    const suppliers = result.rows.map((row: any) => ({
      productId: row.product_id,
      cas: row.cas,
      name: row.name,
      purity: row.purity,
      packageSpec: row.package_spec,
      price: row.price,
      minOrder: row.min_order,
      stock: row.stock_public ? row.stock : null,
      stockPublic: row.stock_public,
      origin: row.origin,
      agent: {
        id: row.agent_id,
        name: row.agent_name,
        username: row.agent_username,
        location: [row.country, row.city].filter(Boolean).join(', '),
      },
      contacts: {
        wechat: row.wechat,
        whatsapp: row.whatsapp,
        telegram: row.telegram,
        messenger: row.messenger,
        line: row.line,
        viber: row.viber,
      },
    }));

    // 按价格升序排序
    suppliers.sort((a: any, b: any) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      return priceA - priceB;
    });

    res.json({
      success: true,
      data: {
        cas,
        total: suppliers.length,
        suppliers,
      },
    });
  } catch (error: any) {
    console.error('Query suppliers by CAS error:', error);
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get product
    const productResult = await pool.query(
      `SELECT p.id, p.cas, p.name, p.name_en, p.formula, p.description, p.image_url, p.status, p.hs_code,
              p.molecular_weight, p.boiling_point, p.melting_point, p.density, p.hazard_classes, p.applications
       FROM products p
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Get suppliers from agent_products
    const suppliersResult = await pool.query(
      `SELECT ap.id, ap.cas, ap.name, ap.purity, ap.package_spec, ap.price, ap.min_order, ap.stock, ap.origin,
              u.id as agent_id, u.name as agent_name
       FROM agent_products ap
       JOIN users u ON ap.agent_id = u.id
       WHERE ap.cas = $1 AND ap.status = 'active'
       ORDER BY ap.price ASC NULLS LAST
       LIMIT 10`,
      [product.cas]
    );

    product.suppliers = suppliersResult.rows;

    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

// Create product (agent only)
router.post('/', authMiddleware, agentOnlyMiddleware, async (req: AuthRequest, res) => {
  const {
    name,
    name_en,
    cas,
    formula,
    description,
    image_url,
    hs_code,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, name_en, cas, formula, description, image_url, hs_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING id, cas, name, name_en`,
      [name, name_en, cas, formula, description, image_url, hs_code]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Create supplier (agent only)
router.post('/:id/suppliers', authMiddleware, agentOnlyMiddleware, async (req: AuthRequest, res) => {
  const { id: productId } = req.params;
  const { name, company, price, moq, delivery_time, location, rating } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (user_id, product_id, name, company, price, moq, delivery_time, location, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.userId, productId, name, company, price, moq, delivery_time, location, rating || 4.5]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
});

export default router;
