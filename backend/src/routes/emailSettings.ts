import { Router } from 'express';
import nodemailer from 'nodemailer';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户所有绑定的邮箱列表
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, sender_name, email, smtp_host, smtp_port, encryption, smtp_auth, 
        imap_host, imap_port, imap_encryption, last_sync_at,
        is_default, is_active, display_name,
        created_at, updated_at
      FROM email_settings 
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at ASC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        senderName: row.sender_name,
        email: row.email,
        smtpHost: row.smtp_host,
        smtpPort: row.smtp_port,
        encryption: row.encryption,
        smtpAuth: row.smtp_auth,
        imapHost: row.imap_host,
        imapPort: row.imap_port,
        imapEncryption: row.imap_encryption,
        lastSyncAt: row.last_sync_at,
        isDefault: row.is_default,
        isActive: row.is_active,
        displayName: row.display_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Get email settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get email settings' });
  }
});

/**
 * 获取单个邮箱配置
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        id, sender_name, email, smtp_host, smtp_port, encryption, smtp_auth, 
        imap_host, imap_port, imap_encryption, last_sync_at,
        is_default, is_active, display_name,
        created_at, updated_at
      FROM email_settings 
      WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        senderName: row.sender_name,
        email: row.email,
        smtpHost: row.smtp_host,
        smtpPort: row.smtp_port,
        encryption: row.encryption,
        smtpAuth: row.smtp_auth,
        imapHost: row.imap_host,
        imapPort: row.imap_port,
        imapEncryption: row.imap_encryption,
        lastSyncAt: row.last_sync_at,
        isDefault: row.is_default,
        isActive: row.is_active,
        displayName: row.display_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Get email setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to get email setting' });
  }
});

/**
 * 添加新邮箱
 */
router.post('/', async (req: AuthRequest, res) => {
  const { 
    senderName, email, password, smtpHost, smtpPort, encryption, smtpAuth,
    imapHost, imapPort, imapEncryption, displayName, isDefault 
  } = req.body;

  if (!senderName || !email || !password || !smtpHost || !smtpPort) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: senderName, email, password, smtpHost, smtpPort' 
    });
  }

  try {
    // 检查是否已绑定过此邮箱
    const existing = await pool.query(
      'SELECT id FROM email_settings WHERE user_id = $1 AND email = $2',
      [req.userId, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'This email has already been bound' 
      });
    }

    // 检查是否是用户的第一个邮箱，如果是则设为默认
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM email_settings WHERE user_id = $1',
      [req.userId]
    );
    const isFirstEmail = parseInt(countResult.rows[0].count) === 0;

    // 如果要设为默认邮箱，先取消其他邮箱的默认状态
    if (isDefault || isFirstEmail) {
      await pool.query(
        'UPDATE email_settings SET is_default = FALSE WHERE user_id = $1',
        [req.userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO email_settings 
       (user_id, sender_name, email, password, smtp_host, smtp_port, encryption, smtp_auth,
        imap_host, imap_port, imap_encryption, display_name, is_default, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
       RETURNING *`,
      [req.userId, senderName, email, password, smtpHost, smtpPort, encryption, smtpAuth ?? true,
       imapHost || null, imapPort || 993, imapEncryption || 'SSL', displayName || null,
       isDefault || isFirstEmail]
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        senderName: result.rows[0].sender_name,
        email: result.rows[0].email,
        smtpHost: result.rows[0].smtp_host,
        smtpPort: result.rows[0].smtp_port,
        encryption: result.rows[0].encryption,
        smtpAuth: result.rows[0].smtp_auth,
        imapHost: result.rows[0].imap_host,
        imapPort: result.rows[0].imap_port,
        imapEncryption: result.rows[0].imap_encryption,
        isDefault: result.rows[0].is_default,
        isActive: result.rows[0].is_active,
        displayName: result.rows[0].display_name,
      },
      message: 'Email added successfully',
    });
  } catch (error: any) {
    console.error('Add email setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to add email setting' });
  }
});

/**
 * 更新邮箱配置
 */
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { 
    senderName, password, smtpHost, smtpPort, encryption, smtpAuth,
    imapHost, imapPort, imapEncryption, displayName 
  } = req.body;

  try {
    // 验证邮箱归属
    const existing = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    // 构建更新SQL
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (senderName) {
      updateFields.push(`sender_name = $${paramIndex++}`);
      updateParams.push(senderName);
    }
    if (password) {
      updateFields.push(`password = $${paramIndex++}`);
      updateParams.push(password);
    }
    if (smtpHost) {
      updateFields.push(`smtp_host = $${paramIndex++}`);
      updateParams.push(smtpHost);
    }
    if (smtpPort) {
      updateFields.push(`smtp_port = $${paramIndex++}`);
      updateParams.push(smtpPort);
    }
    if (encryption) {
      updateFields.push(`encryption = $${paramIndex++}`);
      updateParams.push(encryption);
    }
    if (smtpAuth !== undefined) {
      updateFields.push(`smtp_auth = $${paramIndex++}`);
      updateParams.push(smtpAuth);
    }
    if (imapHost !== undefined) {
      updateFields.push(`imap_host = $${paramIndex++}`);
      updateParams.push(imapHost);
    }
    if (imapPort !== undefined) {
      updateFields.push(`imap_port = $${paramIndex++}`);
      updateParams.push(imapPort);
    }
    if (imapEncryption !== undefined) {
      updateFields.push(`imap_encryption = $${paramIndex++}`);
      updateParams.push(imapEncryption);
    }
    if (displayName !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      updateParams.push(displayName);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(id, req.userId);

    const result = await pool.query(
      `UPDATE email_settings SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      updateParams
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        senderName: result.rows[0].sender_name,
        email: result.rows[0].email,
        smtpHost: result.rows[0].smtp_host,
        smtpPort: result.rows[0].smtp_port,
        encryption: result.rows[0].encryption,
        smtpAuth: result.rows[0].smtp_auth,
        imapHost: result.rows[0].imap_host,
        imapPort: result.rows[0].imap_port,
        imapEncryption: result.rows[0].imap_encryption,
        isDefault: result.rows[0].is_default,
        isActive: result.rows[0].is_active,
        displayName: result.rows[0].display_name,
      },
      message: 'Email settings updated successfully',
    });
  } catch (error: any) {
    console.error('Update email setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to update email setting' });
  }
});

/**
 * 删除邮箱
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    // 验证邮箱归属并获取信息
    const existing = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    const wasDefault = existing.rows[0].is_default;

    // 删除邮箱
    await pool.query(
      'DELETE FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    // 如果删除的是默认邮箱，将第一个邮箱设为默认
    if (wasDefault) {
      const firstEmail = await pool.query(
        'SELECT id FROM email_settings WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [req.userId]
      );
      if (firstEmail.rows.length > 0) {
        await pool.query(
          'UPDATE email_settings SET is_default = TRUE WHERE id = $1',
          [firstEmail.rows[0].id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete email setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete email setting' });
  }
});

/**
 * 设置默认邮箱
 */
router.post('/:id/set-default', async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    // 验证邮箱归属
    const existing = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    // 取消其他邮箱的默认状态
    await pool.query(
      'UPDATE email_settings SET is_default = FALSE WHERE user_id = $1',
      [req.userId]
    );

    // 设置新的默认邮箱
    await pool.query(
      'UPDATE email_settings SET is_default = TRUE WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Default email updated successfully',
    });
  } catch (error: any) {
    console.error('Set default email error:', error);
    res.status(500).json({ success: false, error: 'Failed to set default email' });
  }
});

/**
 * 切换邮箱激活状态
 */
router.post('/:id/toggle-active', async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    // 验证邮箱归属
    const existing = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    const newStatus = !existing.rows[0].is_active;

    // 如果要禁用的是默认邮箱，不允许
    if (!newStatus && existing.rows[0].is_default) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot deactivate default email. Please set another email as default first.' 
      });
    }

    await pool.query(
      'UPDATE email_settings SET is_active = $1 WHERE id = $2',
      [newStatus, id]
    );

    res.json({
      success: true,
      isActive: newStatus,
      message: newStatus ? 'Email activated' : 'Email deactivated',
    });
  } catch (error: any) {
    console.error('Toggle email active error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle email status' });
  }
});

/**
 * 发送测试邮件
 */
router.post('/:id/test', async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email setting not found' });
    }

    const settings = result.rows[0];

    // 创建邮件传输器
    const port = parseInt(settings.smtp_port);
    let secure = false;
    
    if (settings.encryption === 'SSL' || port === 465) {
      secure = true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: port,
      secure: secure,
      auth: {
        user: settings.email,
        pass: settings.password,
      },
      requireTLS: settings.encryption === 'STARTTLS',
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 发送测试邮件
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.email}>`,
      to: settings.email,
      subject: '✅ 邮箱绑定测试成功 - ChemicalLoop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 邮箱绑定成功！</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              恭喜！您的邮箱 <strong>${settings.email}</strong> 已成功绑定到 ChemicalLoop 系统。
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              系统现在可以使用此邮箱发送订单通知、询价回复等邮件。
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px;">
                这是一封测试邮件，请勿回复。<br>
                发送时间：${new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('Test email sent:', info.messageId);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Send test email error:', error);
    
    let errorMessage = 'Failed to send test email';
    if (error.code === 'EAUTH') {
      errorMessage = '认证失败，请检查邮箱地址和密码/授权码是否正确';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = '无法连接到 SMTP 服务器，请检查服务器地址和端口';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '连接超时，请检查网络或服务器配置';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

/**
 * 同步指定邮箱
 */
router.post('/:id/sync', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { folder } = req.body; // 'inbox' 或 'sent'

  try {
    const result = await pool.query(
      'SELECT * FROM email_settings WHERE id = $1 AND user_id = $2 AND is_active = TRUE',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Email setting not found or inactive' 
      });
    }

    const settings = result.rows[0];

    // IMAP 配置
    const imapHost = settings.imap_host || settings.smtp_host.replace('smtp.', 'imap.');
    const imapPort = settings.imap_port || 993;
    const imapEncryption = settings.imap_encryption || 'SSL';

    // 更新最后同步时间
    await pool.query(
      'UPDATE email_settings SET last_sync_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Email sync initiated',
      emailId: id,
      email: settings.email,
      folder: folder || 'inbox',
      config: {
        host: imapHost,
        port: imapPort,
        encryption: imapEncryption,
      },
      note: 'IMAP sync is ready. Please use IMAP client library for full implementation.',
    });
  } catch (error: any) {
    console.error('Sync email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync email' 
    });
  }
});

/**
 * 批量同步所有激活的邮箱
 */
router.post('/sync-all', async (req: AuthRequest, res) => {
  const { folder } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, email, sender_name, imap_host, smtp_host, imap_port, imap_encryption
       FROM email_settings 
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY is_default DESC, created_at ASC`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active email accounts to sync' 
      });
    }

    // 更新所有激活邮箱的最后同步时间
    await pool.query(
      `UPDATE email_settings SET last_sync_at = NOW() 
       WHERE user_id = $1 AND is_active = TRUE`,
      [req.userId]
    );

    const accounts = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      senderName: row.sender_name,
      imapHost: row.imap_host || row.smtp_host.replace('smtp.', 'imap.'),
      imapPort: row.imap_port || 993,
      imapEncryption: row.imap_encryption || 'SSL',
    }));

    res.json({
      success: true,
      message: 'All emails sync initiated',
      accounts,
      folder: folder || 'inbox',
    });
  } catch (error: any) {
    console.error('Sync all emails error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync all emails' 
    });
  }
});

/**
 * 发送外网邮件
 */
router.post('/send', async (req: AuthRequest, res) => {
  const { emailAccountId, to, cc, bcc, subject, content, attachments } = req.body;

  if (!to || !subject || !content) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: to, subject, content' 
    });
  }

  try {
    // 获取指定的邮箱配置，如果没有指定则使用默认邮箱
    const settingsResult = emailAccountId
      ? await pool.query(
          `SELECT * FROM email_settings WHERE id = $1 AND user_id = $2 AND is_active = TRUE`,
          [emailAccountId, req.userId]
        )
      : await pool.query(
          `SELECT * FROM email_settings WHERE user_id = $1 AND is_default = TRUE AND is_active = TRUE`,
          [req.userId]
        );

    if (settingsResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active email account found. Please configure your email settings first.' 
      });
    }

    const settings = settingsResult.rows[0];

    // 创建邮件传输器
    const port = parseInt(settings.smtp_port);
    let secure = false;
    
    if (settings.encryption === 'SSL' || port === 465) {
      secure = true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: port,
      secure: secure,
      auth: {
        user: settings.email,
        pass: settings.password,
      },
      requireTLS: settings.encryption === 'STARTTLS',
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 准备附件
    const emailAttachments = attachments?.map((att: any) => ({
      filename: att.name,
      path: att.url,
    })) || [];

    // 准备邮件选项
    const mailOptions: any = {
      from: `"${settings.sender_name}" <${settings.email}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">${subject}</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
              ${content}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px;">
                This message was sent via ChemicalLoop Platform.<br>
                Sent: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    };

    // 添加抄送(CC)和密送(BCC)
    if (cc && Array.isArray(cc) && cc.length > 0) {
      mailOptions.cc = cc.join(', ');
    }
    if (bcc && Array.isArray(bcc) && bcc.length > 0) {
      mailOptions.bcc = bcc.join(', ');
    }

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    // 记录发送历史到数据库
    await pool.query(
      `INSERT INTO messages (
        user_id, type, folder, title, content,
        sender_name, sender_address,
        recipient_name, recipient_address,
        status, sent_at
      ) VALUES ($1, 'email', 'sent', $2, $3, $4, $5, $6, $7, 'sent', CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        req.userId,
        subject,
        content,
        settings.sender_name,
        settings.email,
        to.split('@')[0],
        to
      ]
    );

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      emailAccount: {
        id: settings.id,
        email: settings.email,
        senderName: settings.sender_name,
      },
      recipients: {
        to: to,
        cc: cc || [],
        bcc: bcc || [],
      },
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Please check server address and port.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timed out. Please check your network or server configuration.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

/**
 * 获取 IMAP 预设配置
 */
router.get('/imap-presets', async (req: AuthRequest, res) => {
  const presets = {
    gmail: { host: 'imap.gmail.com', port: 993, encryption: 'SSL' },
    qq: { host: 'imap.qq.com', port: 993, encryption: 'SSL' },
    '163': { host: 'imap.163.com', port: 993, encryption: 'SSL' },
    outlook: { host: 'outlook.office365.com', port: 993, encryption: 'SSL' },
    yahoo: { host: 'imap.mail.yahoo.com', port: 993, encryption: 'SSL' },
  };
  
  res.json({ success: true, presets });
});

export default router;
