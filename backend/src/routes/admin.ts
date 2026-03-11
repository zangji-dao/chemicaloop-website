import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }

  try {
    // 查找管理员用户
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email.toLowerCase(), 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '管理员账号不存在或密码错误' });
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '管理员账号不存在或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// Verify admin token
router.get('/verify', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    res.json({
      success: true,
      user: {
        id: req.userId,
        role: req.userRole,
      },
    });
  } catch (error) {
    console.error('Verify admin error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取用户列表
    const usersResult = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.verified,
        u.created_at,
        u.avatar_url,
        up.phone,
        up.country,
        up.city,
        up.wechat,
        up.whatsapp,
        up.telegram,
        up.linkedin
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// Get user details
router.get('/users/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.verified,
        u.created_at,
        u.updated_at,
        u.avatar_url,
        up.phone,
        up.website,
        up.country,
        up.city,
        up.address,
        up.description,
        up.wechat,
        up.whatsapp,
        up.telegram,
        up.linkedin,
        up.external_email,
        up.quick_email
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: userResult.rows[0],
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// Update user role
router.put('/users/:id/role', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色类型' });
    }

    await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, id]
    );

    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: '更新角色失败' });
  }
});

// Update user verified status
router.put('/users/:id/verified', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { id } = req.params;
    const { verified } = req.body;

    await pool.query(
      'UPDATE users SET verified = $1, updated_at = NOW() WHERE id = $2',
      [verified, id]
    );

    res.json({ success: true, message: '验证状态更新成功' });
  } catch (error) {
    console.error('Update user verified error:', error);
    res.status(500).json({ error: '更新验证状态失败' });
  }
});

// Get dashboard stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    // 获取总用户数
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // 获取已验证用户数（作为活跃用户的近似）
    const activeUsersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE verified = true"
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // 获取产品数量
    const totalProductsResult = await pool.query('SELECT COUNT(*) FROM agent_products WHERE status = $1', ['active']);
    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    // 获取待处理询价
    const pendingInquiriesResult = await pool.query(
      "SELECT COUNT(*) FROM inquiries WHERE status = 'pending'"
    );
    const pendingInquiries = parseInt(pendingInquiriesResult.rows[0].count);

    // 获取最近活动 - 简化查询
    const recentActivityResult = await pool.query(`
      SELECT 'user_registered' as type, email as user_email, name as user_name, created_at as time
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalProducts,
        pendingInquiries,
      },
      recentActivity: recentActivityResult.rows,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// ==================== 产品管理 ====================

// Get all agent products (admin only)
router.get('/products', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || '';
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND ap.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (ap.name ILIKE $${paramIndex} OR ap.cas ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM agent_products ap ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取产品列表
    const productsResult = await pool.query(
      `SELECT 
        ap.id,
        ap.cas,
        ap.name,
        ap.purity,
        ap.package_spec,
        ap.price,
        ap.min_order,
        ap.stock,
        ap.stock_public,
        ap.origin,
        ap.status,
        ap.review_note,
        ap.reviewed_at,
        ap.created_at,
        ap.updated_at,
        u.id as agent_id,
        u.name as agent_name,
        u.email as agent_email,
        up.country,
        up.city
      FROM agent_products ap
      JOIN users u ON ap.agent_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY ap.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: productsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

// Get product stats by status
router.get('/products/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM agent_products
      GROUP BY status
    `);

    const stats: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      inactive: 0,
    };

    result.rows.forEach((row) => {
      stats[row.status] = parseInt(row.count);
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ error: '获取产品统计失败' });
  }
});

// Update product status (review/approve/reject/activate/deactivate)
router.put('/products/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { id } = req.params;
    const { status, review_note } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    // 更新产品状态
    await pool.query(
      `UPDATE agent_products 
       SET status = $1, 
           review_note = $2, 
           reviewed_at = NOW(), 
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [status, review_note || null, req.userId, id]
    );

    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

// Batch update product status
router.put('/products/batch-status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { ids, status, review_note } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要操作的产品' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    // 批量更新
    await pool.query(
      `UPDATE agent_products 
       SET status = $1, 
           review_note = $2, 
           reviewed_at = NOW(), 
           reviewed_by = $3,
           updated_at = NOW()
       WHERE id = ANY($4)`,
      [status, review_note || null, req.userId, ids]
    );

    res.json({ success: true, message: `已批量更新 ${ids.length} 个产品` });
  } catch (error) {
    console.error('Batch update product status error:', error);
    res.status(500).json({ error: '批量更新失败' });
  }
});

export default router;
