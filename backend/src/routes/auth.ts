import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import pool from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate reset token
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// Send verification email
const sendEmail = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verification Code - Chemicaloop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Verification Code</h2>
        <p style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 20px 0;">${code}</p>
        <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });
};

// Send password reset email
const sendResetEmail = async (email: string, resetToken: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 构建重置链接（使用前端域名 + 重置页面 + token）
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Chemicaloop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p style="color: #1f2937; margin: 20px 0;">
          You requested to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}"
             style="display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          Or copy and paste this link into your browser:<br/>
          <span style="word-break: break-all; color: #2563eb;">${resetLink}</span>
        </p>
      </div>
    `,
  });
};

// Check email availability
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: true, available: true });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ success: true, available: true }); // 格式不对时不检查，让后续验证处理
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // 检查邮箱是否已注册 (users.email)
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      return res.json({ success: true, available: false, error: 'Email already registered' });
    }

    // 检查邮箱是否已被用作联系方式 (user_profiles.external_email 或 user_profiles.quick_email)
    const emailInProfiles = await pool.query(
      'SELECT id FROM user_profiles WHERE external_email = $1 OR quick_email = $1',
      [normalizedEmail]
    );
    if (emailInProfiles.rows.length > 0) {
      return res.json({ success: true, available: false, error: 'Email already used as contact email' });
    }

    res.json({ success: true, available: true });
  } catch (error: any) {
    console.error('Check email error:', error);
    res.status(500).json({ success: false, error: 'Failed to check email' });
  }
});

// Send verification code
router.post('/send-code', async (req, res) => {
  const { email, type } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // 根据类型决定检查逻辑
    if (type === 'change_email') {
      // 修改邮箱场景：检查邮箱是否已被其他用户使用
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ success: false, error: '该邮箱已被注册' });
      }
    } else {
      // 注册场景：检查邮箱是否已注册
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // 检查邮箱是否已被用作联系方式
      const emailInProfiles = await pool.query(
        'SELECT id FROM user_profiles WHERE external_email = $1 OR quick_email = $1',
        [normalizedEmail]
      );
      if (emailInProfiles.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already used as contact email' });
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 90 * 1000); // 90 seconds

    await pool.query(
      `INSERT INTO verification_codes (email, code, type, expires_at)
       VALUES ($1, $2, 'REGISTER', $3)`,
      [normalizedEmail, code, expiresAt]
    );

    const isDev = process.env.NODE_ENV !== 'production';
    console.log(`[DEV] Verification code for ${normalizedEmail}: ${code}`);

    // 仅生产环境发送真实邮件
    if (!isDev) {
      try {
        await sendEmail(normalizedEmail, code);
      } catch (emailError: any) {
        console.error('Email send failed:', emailError.message);
        return res.status(500).json({ success: false, error: 'Failed to send email' });
      }
    }

    res.json({ 
      success: true, 
      message: 'Code sent successfully',
      ...(isDev && { code }) // 开发环境返回验证码
    });
  } catch (error: any) {
    console.error('Send code error:', error);
    res.status(500).json({ success: false, error: 'Failed to send code' });
  }
});

// Check internal email name availability
router.post('/check-internal-email', async (req, res) => {
  const { internalEmailName } = req.body;

  // 长度检查：3-20 字符
  if (!internalEmailName || internalEmailName.length < 3) {
    return res.json({ success: true, available: false, error: 'Internal email name must be at least 3 characters' });
  }
  if (internalEmailName.length > 20) {
    return res.json({ success: true, available: false, error: 'Internal email name must be at most 20 characters' });
  }

  // 格式检查：只允许字母、数字、下划线
  if (!/^[a-zA-Z0-9_]+$/.test(internalEmailName)) {
    return res.json({ success: true, available: false, error: 'Internal email name can only contain letters, numbers, and underscores' });
  }

  // 不能以下划线开头或结尾
  if (internalEmailName.startsWith('_') || internalEmailName.endsWith('_')) {
    return res.json({ success: true, available: false, error: 'Internal email name cannot start or end with underscore' });
  }

  // 不能有连续下划线
  if (internalEmailName.includes('__')) {
    return res.json({ success: true, available: false, error: 'Internal email name cannot contain consecutive underscores' });
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE internal_email_name = $1', [internalEmailName.toLowerCase()]);
    res.json({ 
      success: true, 
      available: result.rows.length === 0,
      error: result.rows.length > 0 ? 'Internal email name already taken' : undefined
    });
  } catch (error: any) {
    console.error('Check internal email name error:', error);
    res.status(500).json({ success: false, error: 'Failed to check internal email name' });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { 
    email, 
    password, 
    name, 
    code,
    internalEmailName,
    country,
    city,
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
    quickEmail
  } = req.body;

  // 基本字段验证
  if (!email || !password || !name || !code) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  // 内网邮箱地址名称验证
  if (!internalEmailName || internalEmailName.length < 3) {
    return res.status(400).json({ success: false, error: 'Internal email name must be at least 3 characters' });
  }

  // 社交通讯方式验证（至少一项）
  const socialContacts = [wechat, whatsapp, telegram, messenger, skype, line, viber, instagram, linkedin, tiktok, quickEmail];
  const filledContacts = socialContacts.filter(v => v && v.trim() !== '');
  if (filledContacts.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one social contact method is required' });
  }

  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists by email
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check if email exists in user_profiles (external_email or quick_email)
    const emailInProfiles = await pool.query(
      'SELECT id FROM user_profiles WHERE external_email = $1 OR quick_email = $1',
      [normalizedEmail]
    );
    if (emailInProfiles.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already used as contact email' });
    }

    // Check if quick_email exists in users table or user_profiles
    if (quickEmail && quickEmail.trim()) {
      const normalizedQuickEmail = quickEmail.toLowerCase().trim();
      
      // Check against users.email
      const quickEmailInUsers = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedQuickEmail]);
      if (quickEmailInUsers.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Quick contact email already registered as account email' });
      }

      // Check against user_profiles.external_email and user_profiles.quick_email
      const quickEmailInProfiles = await pool.query(
        'SELECT id FROM user_profiles WHERE external_email = $1 OR quick_email = $1',
        [normalizedQuickEmail]
      );
      if (quickEmailInProfiles.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Quick contact email already in use' });
      }
    }

    // Check if internal email name exists
    const internalEmailNameExists = await pool.query('SELECT id FROM users WHERE internal_email_name = $1', [internalEmailName.toLowerCase()]);
    if (internalEmailNameExists.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Internal email name already taken' });
    }

    // Verify code (also normalize email for code check)
    const codeCheck = await pool.query(
      `SELECT * FROM verification_codes
       WHERE email = $1 AND code = $2 AND type = 'REGISTER'
       AND expires_at > NOW() AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code]
    );

    if (codeCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate internal email (站内信地址格式: internal_email_name@chemicaloop)
    const internalEmail = `${internalEmailName.toLowerCase()}@chemicaloop`;

    // Create user with internal_email_name and username (默认与 internal_email_name 相同)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, username, internal_email_name, internal_email, role, verified, token_version)
       VALUES ($1, $2, $3, $4, $5, $6, 'USER', true, 0)
       RETURNING id, email, name, username, internal_email_name, internal_email, role, verified, token_version`,
      [normalizedEmail, passwordHash, name, internalEmailName.toLowerCase(), internalEmailName.toLowerCase(), internalEmail]
    );

    const user = result.rows[0];

    // Create user profile with social contacts
    await pool.query(
      `INSERT INTO user_profiles (
        user_id, country, city,
        wechat, whatsapp, telegram, messenger, skype, line,
        viber, instagram, linkedin, tiktok, quick_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [user.id, country || null, city || null,
       wechat || null, whatsapp || null, telegram || null, messenger || null,
       skype || null, line || null, viber || null, instagram || null,
       linkedin || null, tiktok || null, quickEmail || null]
    );

    // Mark code as used
    await pool.query('UPDATE verification_codes SET used = true WHERE id = $1', [codeCheck.rows[0].id]);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      data: { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          internalEmailName: user.internal_email_name,
          internalEmail: user.internal_email,
          role: user.role,
          verified: user.verified
        }, 
        token 
      } 
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    // 将邮箱转换为小写并修剪空格，确保不区分大小写
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Login] Attempting login for email:', normalizedEmail);
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);

    if (result.rows.length === 0) {
      console.log('[Login] User not found for email:', email);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('[Login] User found:', user.email, 'role:', user.role);
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      console.log('[Login] Invalid password for user:', email);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    console.log('[Login] Login successful for user:', email);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          internalEmailName: user.internal_email_name,
          internalEmail: user.internal_email,
          avatar_url: user.avatar_url,
          role: user.role,
          verified: user.verified,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, username, internal_email_name, internal_email, avatar_url, role, verified FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
  }

  try {
    // Get current user with password hash
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.userId]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Logout request for user:', req.userId);

    // 增加用户的 token_version，使当前 token 失效
    await pool.query(
      'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1',
      [req.userId]
    );

    console.log('Token version increased for user:', req.userId);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Forgot password - send reset link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [normalizedEmail]);

    if (userResult.rows.length === 0) {
      // 为了安全，即使用户不存在也返回成功，防止枚举攻击
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    // Send reset email
    await sendResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to send reset link' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Reset token and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long'
    });
  }

  try {
    // Find valid reset token
    const tokenResult = await pool.query(
      `SELECT prt.user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1
       AND prt.expires_at > NOW()
       AND prt.used = false
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const { user_id, email } = tokenResult.rows[0];

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 0) + 1 WHERE id = $2',
      [newPasswordHash, user_id]
    );

    // Mark reset token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    // Also invalidate all other reset tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND token != $2',
      [user_id, token]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// Change email (需要验证码)
router.post('/change-email', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  const { newEmail, code } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!newEmail || !code) {
    return res.status(400).json({ success: false, error: 'New email and verification code are required' });
  }

  const normalizedEmail = newEmail.toLowerCase();

  try {
    // 1. 验证验证码
    const codeResult = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE email = $1 AND code = $2 AND type = 'REGISTER' AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: '验证码无效或已过期' });
    }

    // 2. 检查新邮箱是否已被其他用户使用
    const emailExists = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [normalizedEmail, userId]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ success: false, error: '该邮箱已被其他用户使用' });
    }

    // 3. 更新用户邮箱
    await pool.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [normalizedEmail, userId]
    );

    // 4. 删除已使用的验证码
    await pool.query(
      'DELETE FROM verification_codes WHERE email = $1 AND code = $2',
      [normalizedEmail, code]
    );

    // 5. 获取更新后的用户信息
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.username, u.role, u.created_at, 
              up.internal_email, up.internal_email_name
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: '邮箱修改成功',
      data: {
        email: user.email,
        username: user.username,
      }
    });
  } catch (error: any) {
    console.error('Change email error:', error);
    res.status(500).json({ success: false, error: '修改邮箱失败' });
  }
});

export default router;
