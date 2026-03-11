import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 创建圈子请求（交换联系方式请求）
 * POST /api/circle-requests
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { requesterId, receiverId, messageId, requestedContactIds, requesterSharedContacts, message } = req.body;

  console.log('[Circle Requests] Creating request:', {
    requesterId,
    receiverId,
    messageId,
    message,
    userId: req.userId
  });

  // 验证请求参数
  if (!requesterId || !receiverId || !messageId) {
    return res.status(400).json({ success: false, error: 'requesterId, receiverId and messageId are required' });
  }

  // 验证请求者身份
  if (requesterId !== req.userId) {
    return res.status(403).json({ success: false, error: 'Unauthorized: requesterId does not match authenticated user' });
  }

  try {
    // 检查是否已存在请求
    const existingRequest = await pool.query(
      `SELECT id, status FROM contact_requests
       WHERE requester_id = $1 AND receiver_id = $2 AND message_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [requesterId, receiverId, messageId]
    );

    if (existingRequest.rows.length > 0) {
      const existing = existingRequest.rows[0];
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, error: 'Request already pending' });
      } else if (existing.status === 'approved') {
        return res.status(400).json({ success: false, error: 'Already connected' });
      }
    }

    // 创建圈子请求
    const result = await pool.query(
      `INSERT INTO contact_requests (
         requester_id, receiver_id, message_id,
         requested_contact_ids, requester_shared_contacts,
         message, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        requesterId,
        receiverId,
        messageId,
        JSON.stringify(requestedContactIds || []),
        JSON.stringify(requesterSharedContacts || {}),
        message || '',
        'pending'
      ]
    );

    console.log('[Circle Requests] Request created:', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Circle Requests] Create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create circle request' });
  }
});

/**
 * 获取待处理的圈子请求列表
 * GET /api/circle-requests/pending
 */
router.get('/pending', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, u.name as requester_name, u.email as requester_email
       FROM contact_requests cr
       JOIN users u ON cr.requester_id = u.id
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('[Circle Requests] Fetch pending error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending requests' });
  }
});

/**
 * 获取圈子请求状态
 * GET /api/circle-requests/:messageId/status
 */
router.get('/:messageId/status', authMiddleware, async (req: AuthRequest, res) => {
  const { messageId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM contact_requests
       WHERE message_id = $1 AND requester_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [messageId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Circle Requests] Fetch status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch request status' });
  }
});

/**
 * 接受圈子请求
 * POST /api/circle-requests/:requestId/approve
 */
router.post('/:requestId/approve', authMiddleware, async (req: AuthRequest, res) => {
  const { requestId } = req.params;
  const { receiverContactIds, receiverSharedContacts } = req.body;

  try {
    // 获取请求详情
    const requestResult = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // 验证接收者身份
    if (request.receiver_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // 更新请求状态
    await pool.query(
      'UPDATE contact_requests SET status = $1 WHERE id = $2',
      ['approved', requestId]
    );

    // 添加到联系人成员表
    await pool.query(
      `INSERT INTO contact_members (user_id, contact_user_id, contact_details)
       VALUES ($1, $2, $3), ($4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [request.requester_id, request.receiver_id, '{}', request.receiver_id, request.requester_id, '{}']
    );

    console.log('[Circle Requests] Request approved:', requestId);

    res.json({ success: true, message: 'Request approved' });
  } catch (error: any) {
    console.error('[Circle Requests] Approve error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve request' });
  }
});

/**
 * 拒绝圈子请求
 * POST /api/circle-requests/:requestId/reject
 */
router.post('/:requestId/reject', authMiddleware, async (req: AuthRequest, res) => {
  const { requestId } = req.params;

  try {
    // 获取请求详情
    const requestResult = await pool.query(
      'SELECT * FROM contact_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // 验证接收者身份
    if (request.receiver_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // 更新请求状态
    await pool.query(
      'UPDATE contact_requests SET status = $1 WHERE id = $2',
      ['rejected', requestId]
    );

    console.log('[Circle Requests] Request rejected:', requestId);

    res.json({ success: true, message: 'Request rejected' });
  } catch (error: any) {
    console.error('[Circle Requests] Reject error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject request' });
  }
});

export default router;
