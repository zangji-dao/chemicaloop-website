import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 社交通讯联系方式列表
const SOCIAL_CONTACT_FIELDS = [
  'wechat', 'whatsapp', 'telegram', 'messenger',
  'skype', 'line', 'viber', 'instagram',
  'linkedin', 'tiktok', 'quick_email'
];

// GET /api/profile - 获取当前用户资料
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // 获取用户基本信息
    const userResult = await pool.query(
      `SELECT id, email, name, internal_email_name, internal_email, avatar_url, role, verified, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 获取用户详细资料
    const profileResult = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    // 计算已填写的社交通讯方式数量
    const filledSocialContacts = SOCIAL_CONTACT_FIELDS.filter(
      field => profile[field] && profile[field].trim() !== ''
    ).length;

    res.json({
      success: true,
      data: {
        // 基础信息
        id: user.id,
        email: user.email,
        name: user.name,
        internalEmailName: user.internal_email_name,
        internalEmail: user.internal_email,
        avatarUrl: user.avatar_url,
        role: user.role,
        verified: user.verified,
        createdAt: user.created_at,
        
        // 地址信息
        country: profile.country || '',
        city: profile.city || '',
        address: profile.address || '',
        
        // 社交通讯联系方式
        wechat: profile.wechat || '',
        whatsapp: profile.whatsapp || '',
        telegram: profile.telegram || '',
        messenger: profile.messenger || '',
        skype: profile.skype || '',
        line: profile.line || '',
        viber: profile.viber || '',
        instagram: profile.instagram || '',
        linkedin: profile.linkedin || '',
        tiktok: profile.tiktok || '',
        quickEmail: profile.quick_email || '',
        
        // 统计信息
        socialContactsCount: filledSocialContacts,
        hasMinimumSocialContacts: filledSocialContacts >= 1,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// PUT /api/profile - 更新用户资料
router.put('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const {
      // 显示名称（可修改）
      name,
      // 注册邮箱
      email,
      // 地址信息
      country,
      city,
      address,
      // 社交通讯联系方式
      wechat,
      whatsapp,
      telegram,
      messenger,
      skype,
      line,
      viber,
      instagram,
      linkedin,
      tiktok,
      quickEmail,
    } = req.body;

    // 验证至少填写一项社交通讯方式
    const socialContacts = [wechat, whatsapp, telegram, messenger, skype, line, viber, instagram, linkedin, tiktok, quickEmail];
    const filledContacts = socialContacts.filter(v => v && v.trim() !== '');
    
    if (filledContacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one social contact method is required'
      });
    }

    // 更新 users 表的显示名称
    if (name !== undefined) {
      await pool.query(
        `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
        [name, userId]
      );
    }

    // 更新 users.email（注册邮箱）
    if (email) {
      await pool.query(
        `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
        [email, userId]
      );
    }

    // 检查 profile 是否存在
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // 创建新 profile
      await pool.query(
        `INSERT INTO user_profiles (
          user_id, country, city, address,
          wechat, whatsapp, telegram, messenger, skype, line,
          viber, instagram, linkedin, tiktok, quick_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [userId, country, city, address,
         wechat, whatsapp, telegram, messenger, skype, line,
         viber, instagram, linkedin, tiktok, quickEmail]
      );
    } else {
      // 更新 profile
      await pool.query(
        `UPDATE user_profiles SET
          country = $1, city = $2, address = $3,
          wechat = $4, whatsapp = $5, telegram = $6, messenger = $7,
          skype = $8, line = $9, viber = $10, instagram = $11,
          linkedin = $12, tiktok = $13, quick_email = $14,
          updated_at = NOW()
        WHERE user_id = $15`,
        [country, city, address,
         wechat, whatsapp, telegram, messenger, skype, line,
         viber, instagram, linkedin, tiktok, quickEmail, userId]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// POST /api/profile/check-internal-email - 检查内网邮箱地址是否可用
router.post('/check-internal-email', async (req, res) => {
  try {
    const { internalEmailName, currentUserId } = req.body;

    // 长度检查：3-20 字符
    if (!internalEmailName || internalEmailName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name must be at least 3 characters'
      });
    }
    if (internalEmailName.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name must be at most 20 characters'
      });
    }

    // 格式检查：只允许字母、数字、下划线
    if (!/^[a-zA-Z0-9_]+$/.test(internalEmailName)) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name can only contain letters, numbers, and underscores'
      });
    }

    // 不能以下划线开头或结尾
    if (internalEmailName.startsWith('_') || internalEmailName.endsWith('_')) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name cannot start or end with underscore'
      });
    }

    // 不能有连续下划线
    if (internalEmailName.includes('__')) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name cannot contain consecutive underscores'
      });
    }

    // 检查内网邮箱地址是否已存在
    const result = await pool.query(
      'SELECT id FROM users WHERE internal_email_name = $1 AND id != $2',
      [internalEmailName.toLowerCase(), currentUserId || '00000000-0000-0000-0000-000000000000']
    );

    res.json({
      success: true,
      available: result.rows.length === 0
    });
  } catch (error) {
    console.error('Check internal email name error:', error);
    res.status(500).json({ success: false, error: 'Failed to check internal email name' });
  }
});

// POST /api/profile/set-internal-email - 设置内网邮箱地址（仅注册时调用，不可修改）
router.post('/set-internal-email', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { internalEmailName } = req.body;

    if (!internalEmailName || internalEmailName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name must be at least 3 characters'
      });
    }

    // 检查格式
    if (!/^[a-zA-Z0-9_]+$/.test(internalEmailName)) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name can only contain letters, numbers, and underscores'
      });
    }

    // 检查用户是否已有内网邮箱地址
    const userResult = await pool.query(
      'SELECT internal_email_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0]?.internal_email_name) {
      return res.status(400).json({
        success: false,
        error: 'Internal email already set and cannot be changed'
      });
    }

    // 检查内网邮箱地址是否已存在
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE internal_email_name = $1',
      [internalEmailName]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Internal email name already taken'
      });
    }

    // 生成完整内网邮箱 (格式: internal_email_name@chemicaloop)
    const internalEmail = `${internalEmailName.toLowerCase()}@chemicaloop`;

    // 更新内网邮箱
    await pool.query(
      'UPDATE users SET internal_email_name = $1, internal_email = $2, updated_at = NOW() WHERE id = $3',
      [internalEmailName.toLowerCase(), internalEmail, userId]
    );

    res.json({
      success: true,
      message: 'Internal email set successfully',
      data: {
        internalEmailName: internalEmailName.toLowerCase(),
        internalEmail
      }
    });
  } catch (error) {
    console.error('Set internal email error:', error);
    res.status(500).json({ success: false, error: 'Failed to set internal email' });
  }
});

// POST /api/profile/verify-email - 发送外网邮箱验证邮件
router.post('/verify-email', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // TODO: 实现发送验证邮件逻辑
    // 这里暂时只更新邮箱，实际需要发送验证邮件并处理验证流程

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification email' });
  }
});

// GET /api/profile/:userId - 获取其他用户的公开资料
router.get('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // 获取用户基本信息
    const userResult = await pool.query(
      `SELECT id, name, internal_email_name, avatar_url, role 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 获取用户公开的社交通讯方式
    const profileResult = await pool.query(
      `SELECT wechat, whatsapp, telegram, messenger, line, skype, viber, instagram, linkedin, tiktok, quick_email 
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    // 调试日志
    console.log('[Profile API] userId:', userId);
    console.log('[Profile API] profile data:', profile);
    console.log('[Profile API] profileResult.rows.length:', profileResult.rows.length);

    // 只返回非空的IM联系方式
    const imContacts: { type: string; value: string }[] = [];
    
    if (profile.wechat && profile.wechat.trim()) {
      imContacts.push({ type: 'wechat', value: profile.wechat });
    }
    if (profile.whatsapp && profile.whatsapp.trim()) {
      imContacts.push({ type: 'whatsapp', value: profile.whatsapp });
    }
    if (profile.telegram && profile.telegram.trim()) {
      imContacts.push({ type: 'telegram', value: profile.telegram });
    }
    if (profile.messenger && profile.messenger.trim()) {
      imContacts.push({ type: 'messenger', value: profile.messenger });
    }
    if (profile.line && profile.line.trim()) {
      imContacts.push({ type: 'line', value: profile.line });
    }
    if (profile.skype && profile.skype.trim()) {
      imContacts.push({ type: 'skype', value: profile.skype });
    }
    if (profile.viber && profile.viber.trim()) {
      imContacts.push({ type: 'viber', value: profile.viber });
    }
    if (profile.instagram && profile.instagram.trim()) {
      imContacts.push({ type: 'instagram', value: profile.instagram });
    }
    if (profile.linkedin && profile.linkedin.trim()) {
      imContacts.push({ type: 'linkedin', value: profile.linkedin });
    }
    if (profile.tiktok && profile.tiktok.trim()) {
      imContacts.push({ type: 'tiktok', value: profile.tiktok });
    }
    if (profile.quick_email && profile.quick_email.trim()) {
      imContacts.push({ type: 'quick_email', value: profile.quick_email });
    }

    console.log('[Profile API] imContacts:', imContacts);
    console.log('[Profile API] hasIM:', imContacts.length > 0);

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        internalEmailName: user.internal_email_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        // IM联系方式
        imContacts,
        hasIM: imContacts.length > 0,
        // 为了兼容前端现有逻辑，同时返回独立的IM字段
        wechat: profile.wechat || '',
        whatsapp: profile.whatsapp || '',
        telegram: profile.telegram || '',
        messenger: profile.messenger || '',
        line: profile.line || '',
        skype: profile.skype || '',
        viber: profile.viber || '',
        instagram: profile.instagram || '',
        linkedin: profile.linkedin || '',
        tiktok: profile.tiktok || '',
        quickEmail: profile.quick_email || '',
      }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user profile' });
  }
});

export default router;
