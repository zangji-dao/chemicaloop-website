import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ==================== 获取消息列表 ====================
router.get('/', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { folder = 'inbox', search = '', limit = '50', offset = '0' } = req.query;

    // 垃圾桶文件夹显示已删除的消息，其他文件夹显示未删除的消息
    const isTrashFolder = folder === 'trash';
    
    let query = `
      SELECT 
        m.id, m.type, m.folder, m.title, m.content,
        m.language, m.translations,
        m.sender_id, m.sender_name, m.sender_address,
        m.recipient_id, m.recipient_name, m.recipient_address,
        m.product_name, m.cas, m.quantity,
        m.status, m.unread, m.starred, m.deleted, m.archived,
        m.reply_content, m.reply_from, m.reply_address,
        m.auto_saved_at, m.created_at, m.sent_at, m.read_at,
        -- 关联查询 sender 的 internal_email，如果为空则使用 sender_address
        COALESCE(u.internal_email, m.sender_address) as sender_internal_email,
        -- 检查外网发件人是否为站内用户（通过注册邮箱或绑定邮箱匹配）
        su.id as sender_registered_user_id,
        su.name as sender_registered_user_name,
        -- 检查是否已经是即时通讯联系人
        CASE WHEN cm.id IS NOT NULL THEN true ELSE false END as is_im_contact,
        -- 生成预览
        SUBSTRING(m.content, 1, 100) as preview,
        -- 格式化时间（显示完整日期时间）
        CASE 
          WHEN m.auto_saved_at IS NOT NULL THEN 'Last saved at ' || TO_CHAR(m.auto_saved_at, 'YYYY-MM-DD HH24:MI')
          WHEN m.sent_at IS NOT NULL THEN TO_CHAR(m.sent_at, 'YYYY-MM-DD HH24:MI')
          ELSE TO_CHAR(m.created_at, 'YYYY-MM-DD HH24:MI')
        END as time
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      -- 检查外网发件人邮箱是否匹配站内用户（注册邮箱或绑定邮箱）
      LEFT JOIN LATERAL (
        SELECT id, name FROM users 
        WHERE users.email = m.sender_address
           OR users.id IN (SELECT user_id FROM email_accounts WHERE email = m.sender_address)
        LIMIT 1
      ) su ON true
      -- 检查是否已经是即时通讯联系人
      LEFT JOIN contact_members cm ON cm.user_id = $1 AND cm.contact_user_id = su.id
      WHERE m.user_id = $1
        AND m.deleted = ${isTrashFolder ? 'true' : 'false'}
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    // 过滤文件夹
    if (folder && folder !== 'all') {
      paramCount++;
      // inquiries 文件夹重定向到 inbox（兼容旧链接）
      if (folder === 'inquiries') {
        query += ` AND folder = $${paramCount}`;
        params.push('inbox');
      } else {
        query += ` AND folder = $${paramCount}`;
        params.push(folder);
      }
    }

    // 搜索功能
    if (search) {
      paramCount++;
      query += ` AND (
        title ILIKE $${paramCount} OR
        content ILIKE $${paramCount} OR
        product_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // 排序
    query += ` ORDER BY created_at DESC`;

    // 分页
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // 计算未读数量（根据当前查询的文件夹）
    let unreadQuery = `SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND unread = true AND deleted = false`;
    const unreadParams: any[] = [userId];

    if (folder && folder !== 'all') {
      // inquiries 文件夹重定向到 inbox（兼容旧链接）
      if (folder === 'inquiries') {
        unreadQuery += ` AND folder = $2`;
        unreadParams.push('inbox');
      } else {
        unreadQuery += ` AND folder = $2`;
        unreadParams.push(folder);
      }
    }

    const unreadCount = await pool.query(unreadQuery, unreadParams);

    res.json({
      messages: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      total: result.rowCount
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ==================== 获取单个消息详情 ====================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT 
        m.*,
        -- 关联查询 sender 的 internal_email
        COALESCE(u.internal_email, m.sender_address) as sender_internal_email,
        -- 检查外网发件人是否为站内用户（通过注册邮箱或绑定邮箱匹配）
        su.id as sender_registered_user_id,
        su.name as sender_registered_user_name,
        -- 检查是否已经是即时通讯联系人
        CASE WHEN cm.id IS NOT NULL THEN true ELSE false END as is_im_contact
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      -- 检查外网发件人邮箱是否匹配站内用户（注册邮箱或绑定邮箱）
      LEFT JOIN LATERAL (
        SELECT id, name FROM users 
        WHERE users.email = m.sender_address
           OR users.id IN (SELECT user_id FROM email_accounts WHERE email = m.sender_address)
        LIMIT 1
      ) su ON true
      LEFT JOIN contact_members cm ON cm.user_id = $2 AND cm.contact_user_id = su.id
      WHERE m.id = $1 AND m.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 标记为已读
    await pool.query(
      `UPDATE messages SET unread = false, read_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// ==================== 创建新消息 ====================
router.post('/', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      type = 'inquiry',
      title,
      content,
      recipient_id, // 收件人用户ID（站内消息）
      recipient_address,
      sender_name,
      folder = 'inbox',
      status = 'pending',
      product_name,
      cas,
      quantity
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // 获取发件人信息
    const senderResult = await pool.query(
      `SELECT id, name, username, email FROM users WHERE id = $1`,
      [userId]
    );
    const sender = senderResult.rows[0];
    const senderName = sender_name || sender?.name || sender?.username || '匿名用户';

    // 如果指定了收件人ID，则发送站内消息
    if (recipient_id) {
      // 获取收件人信息
      const recipientResult = await pool.query(
        `SELECT id, name, username, email FROM users WHERE id = $1`,
        [recipient_id]
      );

      if (recipientResult.rows.length === 0) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      const recipient = recipientResult.rows[0];

      // 在收件人的收件箱创建消息
      const result = await pool.query(
        `INSERT INTO messages (
          user_id, type, folder, title, content,
          sender_id, sender_name, sender_address,
          recipient_id, recipient_name, recipient_address,
          status, product_name, cas, quantity,
          unread, sent_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          recipient_id, type, 'inbox', title, content,
          userId, senderName, sender?.email,
          recipient_id, recipient?.name || recipient?.username, recipient?.email,
          status, product_name, cas, quantity
        ]
      );

      // 同时在发件人的已发送文件夹创建副本
      await pool.query(
        `INSERT INTO messages (
          user_id, type, folder, title, content,
          sender_id, sender_name, sender_address,
          recipient_id, recipient_name, recipient_address,
          status, product_name, cas, quantity,
          unread, sent_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          userId, type, 'sent', title, content,
          userId, senderName, sender?.email,
          recipient_id, recipient?.name || recipient?.username, recipient?.email,
          status, product_name, cas, quantity
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: result.rows[0]
      });
    }

    // 普通消息创建（草稿或外部邮件）
    const result = await pool.query(
      `INSERT INTO messages (
        user_id, type, folder, title, content,
        recipient_address, status,
        product_name, cas, quantity,
        auto_saved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [userId, type, folder, title, content, recipient_address, status, product_name, cas, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// ==================== 保存/更新草稿（自动保存或手动保存）====================
router.post('/draft', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      id, // 如果有 id 则更新，否则创建新草稿
      title,
      content,
      recipient_address,
      product_name,
      cas,
      quantity
    } = req.body;

    // 检查是否已有草稿
    if (id) {
      // 更新现有草稿
      const result = await pool.query(
        `UPDATE messages SET
          title = COALESCE($2, title),
          content = COALESCE($3, content),
          recipient_address = COALESCE($4, recipient_address),
          product_name = COALESCE($5, product_name),
          cas = COALESCE($6, cas),
          quantity = COALESCE($7, quantity),
          auto_saved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $8 AND status = 'pending'
        RETURNING *`,
        [id, title, content, recipient_address, product_name, cas, quantity, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      return res.json(result.rows[0]);
    } else {
      // 查找最新的草稿
      const existingDraft = await pool.query(
        `SELECT id FROM messages 
         WHERE user_id = $1 AND folder = 'drafts' AND status = 'pending' 
         ORDER BY auto_saved_at DESC LIMIT 1`,
        [userId]
      );

      if (existingDraft.rows.length > 0) {
        // 更新现有草稿
        const result = await pool.query(
          `UPDATE messages SET
            title = COALESCE($2, title),
            content = COALESCE($3, content),
            recipient_address = COALESCE($4, recipient_address),
            product_name = COALESCE($5, product_name),
            cas = COALESCE($6, cas),
            quantity = COALESCE($7, quantity),
            auto_saved_at = CURRENT_TIMESTAMP
          WHERE id = $8
          RETURNING *`,
          [title, content, recipient_address, product_name, cas, quantity, userId, existingDraft.rows[0].id]
        );

        return res.json(result.rows[0]);
      } else {
        // 创建新草稿
        const result = await pool.query(
          `INSERT INTO messages (
            user_id, type, folder, title, content,
            recipient_address, status,
            product_name, cas, quantity,
            auto_saved_at
          ) VALUES ($1, 'inquiry', 'drafts', $2, $3, $4, 'pending', $5, $6, $7, CURRENT_TIMESTAMP)
          RETURNING *`,
          [userId, title || '(No Subject)', content || '(No content)', recipient_address, product_name, cas, quantity]
        );

        return res.status(201).json(result.rows[0]);
      }
    }
  } catch (error: any) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// ==================== 发送消息（从草稿发送）====================
router.post('/:id/send', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 检查消息是否存在且属于该用户
    const message = await pool.query(
      `SELECT * FROM messages WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (message.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const msgData = message.rows[0];

    // 验证必填字段
    if (!msgData.title || !msgData.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // 所有回复都保存到 sent 文件夹
    // 站内信（@chemicaloop）的回复在同步时会被过滤，不会同步到邮件服务器
    const result = await pool.query(
      `UPDATE messages SET
        folder = 'sent',
        status = 'sent',
        sent_at = CURRENT_TIMESTAMP,
        auto_saved_at = NULL
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [id, userId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== 删除消息 ====================
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 先检查消息当前状态
    const checkResult = await pool.query(
      `SELECT id, folder, deleted FROM messages WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = checkResult.rows[0];

    // 如果消息已在垃圾桶（deleted = true 或 folder = 'trash'），则永久删除
    if (message.deleted || message.folder === 'trash') {
      await pool.query(
        `DELETE FROM messages WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      res.json({ success: true, message: 'Message permanently deleted' });
    } else {
      // 否则移到垃圾桶（软删除）
      const result = await pool.query(
        `UPDATE messages SET deleted = true, folder = 'trash' WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
      );
      res.json({ success: true, message: 'Message moved to trash' });
    }
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ==================== 星标/取消星标 ====================
router.patch('/:id/star', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { starred } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE messages SET starred = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [starred, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error starring message:', error);
    res.status(500).json({ error: 'Failed to star message' });
  }
});

// ==================== 恢复已删除的消息 ====================
router.patch('/:id/restore', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { folder } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!folder) {
      return res.status(400).json({ error: 'Target folder is required' });
    }

    const result = await pool.query(
      `UPDATE messages SET folder = $1, deleted = false WHERE id = $2 AND user_id = $3 RETURNING *`,
      [folder, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      success: true,
      message: 'Message restored successfully',
      folder
    });
  } catch (error: any) {
    console.error('Error restoring message:', error);
    res.status(500).json({ error: 'Failed to restore message' });
  }
});

// ==================== 标记单个消息为已读 ====================
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE messages SET unread = false, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ==================== 批量操作 ====================
router.post('/batch', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid message IDs' });
    }

    if (action === 'delete') {
      // 批量删除需要区分垃圾桶和非垃圾桶的消息
      // 1. 永久删除已在垃圾桶的消息
      await pool.query(
        `DELETE FROM messages WHERE id = ANY($1) AND user_id = $2 AND (deleted = true OR folder = 'trash')`,
        [ids, userId]
      );
      // 2. 将不在垃圾桶的消息移到垃圾桶
      await pool.query(
        `UPDATE messages SET deleted = true, folder = 'trash' WHERE id = ANY($1) AND user_id = $2 AND deleted = false AND folder != 'trash'`,
        [ids, userId]
      );
    } else {
      let query = '';
      switch (action) {
        case 'archive':
          query = `UPDATE messages SET archived = true WHERE id = ANY($1) AND user_id = $2`;
          break;
        case 'mark_read':
          query = `UPDATE messages SET unread = false WHERE id = ANY($1) AND user_id = $2`;
          break;
        case 'star':
          query = `UPDATE messages SET starred = true WHERE id = ANY($1) AND user_id = $2`;
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
      await pool.query(query, [ids, userId]);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error performing batch operation:', error);
    res.status(500).json({ error: 'Failed to perform batch operation' });
  }
});

// ==================== 标记所有消息为已读 ====================
router.post('/mark-all-read', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { folder } = req.body;

    let query = `UPDATE messages SET unread = false WHERE user_id = $1 AND deleted = false`;
    const params: any[] = [userId];

    // 如果指定了文件夹，只标记该文件夹的消息
    if (folder) {
      // inquiries 文件夹重定向到 inbox（兼容旧链接）
      if (folder === 'inquiries') {
        query += ` AND folder = $2`;
        params.push('inbox');
      } else {
        query += ` AND folder = $2`;
        params.push(folder);
      }
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      affected: result.rowCount || 0,
    });
  } catch (error: any) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Failed to mark all messages as read' });
  }
});

// ==================== 获取未读数量 ====================
router.get('/unread/count', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { folder } = req.query;

    // 如果指定了文件夹，返回单个文件夹的未读数量
    if (folder) {
      // inquiries 文件夹重定向到 inbox（兼容旧链接）
      const targetFolder = folder === 'inquiries' ? 'inbox' : folder;
      
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM messages 
         WHERE user_id = $1 AND unread = true AND deleted = false AND folder = $2`,
        [userId, targetFolder]
      );
      return res.json({ unreadCount: parseInt(result.rows[0].count) });
    }

    // 如果没有指定文件夹，返回所有文件夹的未读数量（批量查询，一次数据库访问）
    const result = await pool.query(
      `SELECT folder, COUNT(*) as count 
       FROM messages 
       WHERE user_id = $1 AND unread = true AND deleted = false 
       GROUP BY folder`,
      [userId]
    );

    // 构建所有文件夹的未读数量对象
    const counts: Record<string, number> = {
      inbox: 0,
      sent: 0,
      drafts: 0,
      trash: 0,
      archive: 0,
      circle: 0,
      settings: 0,
    };

    result.rows.forEach(row => {
      if (counts.hasOwnProperty(row.folder)) {
        counts[row.folder] = parseInt(row.count);
      }
    });

    // 计算总未读数量
    const totalUnread = Object.values(counts).reduce((sum, count) => sum + count, 0);

    res.json({ 
      unreadCount: totalUnread,
      countsByFolder: counts
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ==================== 获取最近联系人 ====================
router.get('/contacts/recent', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 10 } = req.query;

    // 从用户发送和接收的消息中提取最近联系人
    const result = await pool.query(`
      SELECT DISTINCT ON (contact_address, contact_name)
        contact_address,
        contact_name,
        MAX(created_at) as last_contact_time,
        COUNT(*) as message_count
      FROM (
        -- 发送的消息
        SELECT 
          recipient_address as contact_address,
          recipient_name as contact_name,
          created_at
        FROM messages 
        WHERE user_id = $1 
          AND recipient_address IS NOT NULL 
          AND recipient_address != ''
          AND deleted = false
        
        UNION ALL
        
        -- 接收的消息
        SELECT 
          sender_address as contact_address,
          sender_name as contact_name,
          created_at
        FROM messages 
        WHERE user_id = $1 
          AND sender_address IS NOT NULL 
          AND sender_address != ''
          AND deleted = false
      ) AS contacts
      GROUP BY contact_address, contact_name
      ORDER BY contact_address, contact_name, MAX(created_at) DESC
      LIMIT $2
    `, [userId, parseInt(limit as string)]);

    // 格式化联系人列表
    const contacts = result.rows.map(row => ({
      address: row.contact_address,
      name: row.contact_name || row.contact_address.split('@')[0],
      lastContactTime: row.last_contact_time,
      messageCount: row.message_count
    }));

    res.json({ contacts });
  } catch (error: any) {
    console.error('Error fetching recent contacts:', error);
    res.status(500).json({ error: 'Failed to fetch recent contacts' });
  }
});

export default router;
