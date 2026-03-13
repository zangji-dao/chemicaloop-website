import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取用户的圈子联系人列表
 * GET /api/circle-contacts?userId=xxx
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { userId } = req.query;

  // 验证用户身份
  if (userId !== req.userId) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // 获取用户的联系人列表
    const result = await pool.query(
      `SELECT cm.contact_user_id, u.name, u.email, u.role, cm.contact_details, cm.created_at
       FROM contact_members cm
       JOIN users u ON cm.contact_user_id = u.id
       WHERE cm.user_id = $1
       ORDER BY cm.created_at DESC`,
      [userId]
    );

    // 映射字段名以匹配前端期望
    const members = result.rows.map(row => ({
      id: row.contact_user_id,
      contactUserId: row.contact_user_id,
      userName: row.name,
      userEmail: row.email,
      role: row.role,
      contactDetails: row.contact_details,
      createdAt: row.created_at
    }));

    console.log('[Circle Contacts] Fetched contacts for user:', userId, 'Count:', members.length);

    res.json({
      success: true,
      data: members
    });
  } catch (error: any) {
    console.error('[Circle Contacts] Fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch circle contacts' });
  }
});

/**
 * 获取单个联系人详情
 * GET /api/contact-members/:contactId
 */
router.get('/:contactId', authMiddleware, async (req: AuthRequest, res) => {
  const { contactId } = req.params;

  try {
    // 检查是否是当前用户的联系人
    const contactResult = await pool.query(
      `SELECT cm.contact_user_id, cm.contact_details, cm.created_at,
              u.id, u.name, u.email, u.role, u.avatar_url, u.username
       FROM contact_members cm
       JOIN users u ON cm.contact_user_id = u.id
       WHERE cm.user_id = $1 AND cm.contact_user_id = $2`,
      [req.userId, contactId]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const row = contactResult.rows[0];
    
    // 获取用户详细资料
    const profileResult = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [contactId]
    );

    const contact = {
      id: row.contact_user_id,
      contactUserId: row.contact_user_id,
      userName: row.name,
      userEmail: row.email,
      role: row.role,
      avatarUrl: row.avatar_url,
      username: row.username,
      contactDetails: row.contact_details,
      createdAt: row.created_at,
      profile: profileResult.rows[0] || null
    };

    res.json({
      success: true,
      contact
    });
  } catch (error: any) {
    console.error('[Circle Contacts] Get contact detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get contact detail' });
  }
});

/**
 * 删除圈子联系人（拉黑/移除）
 * DELETE /api/circle-contacts/:contactId
 */
router.delete('/:contactId', authMiddleware, async (req: AuthRequest, res) => {
  const { contactId } = req.params;

  try {
    // 检查联系人是否存在
    const contactResult = await pool.query(
      `SELECT * FROM contact_members WHERE user_id = $1 AND contact_user_id = $2`,
      [req.userId, contactId]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    // 删除联系人关系（双向）
    await pool.query(
      `DELETE FROM contact_members
       WHERE (user_id = $1 AND contact_user_id = $2)
          OR (user_id = $2 AND contact_user_id = $1)`,
      [req.userId, contactId]
    );

    console.log('[Circle Contacts] Removed contact:', contactId);

    res.json({ success: true, message: 'Contact removed' });
  } catch (error: any) {
    console.error('[Circle Contacts] Remove error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove contact' });
  }
});

export default router;
