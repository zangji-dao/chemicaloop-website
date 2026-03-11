import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { verifyUser, unauthorizedResponse } from '@/lib/auth';

// 社交通讯联系方式字段
const SOCIAL_CONTACT_FIELDS = [
  'wechat', 'whatsapp', 'telegram', 'messenger',
  'skype', 'qq', 'line', 'viber', 'instagram',
  'linkedin', 'tiktok', 'quick_email'
];

/**
 * 获取当前用户资料
 * GET /api/profile
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyUser(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error);
    }

    const userId = auth.userId;
    const db = await getDb(schema);

    // 获取用户基本信息
    const userResult = await db.execute(sql`
      SELECT id, email, name, username, internal_email_name, internal_email, avatar_url, role, verified, created_at 
      FROM users WHERE id = ${userId}
    `);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0] as any;

    // 获取用户详细资料
    const profileResult = await db.execute(sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `);

    const profile = (profileResult.rows[0] || {}) as any;

    // 计算已填写的社交通讯方式数量
    const filledSocialContacts = SOCIAL_CONTACT_FIELDS.filter(
      field => profile[field] && profile[field].trim() !== ''
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        // 基础信息
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || user.internal_email_name,
        internalEmailName: user.internal_email_name,
        internalEmail: user.internal_email,
        avatarUrl: user.avatar_url,
        role: user.role,
        verified: user.verified,
        createdAt: user.created_at,
        
        // 联系邮箱
        externalEmail: profile.external_email || '',
        externalEmailVerified: profile.external_email_verified || false,
        
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
        qq: profile.qq || '',
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
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * 更新用户资料
 * PUT /api/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyUser(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error);
    }

    const userId = auth.userId;
    const body = await request.json();
    const {
      externalEmail,
      country,
      city,
      address,
      wechat,
      whatsapp,
      telegram,
      messenger,
      skype,
      qq,
      line,
      viber,
      instagram,
      linkedin,
      tiktok,
      quickEmail,
    } = body;

    // 验证至少填写一项社交通讯方式
    const socialContacts = [wechat, whatsapp, telegram, messenger, skype, qq, line, viber, instagram, linkedin, tiktok, quickEmail];
    const filledContacts = socialContacts.filter(v => v && v.trim() !== '');
    
    if (filledContacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one social contact method is required' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 检查 profile 是否存在
    const existingProfile = await db.execute(sql`
      SELECT id FROM user_profiles WHERE user_id = ${userId}
    `);

    if (existingProfile.rows.length === 0) {
      // 创建新 profile
      await db.execute(sql`
        INSERT INTO user_profiles (
          user_id, external_email, country, city, address,
          wechat, whatsapp, telegram, messenger, skype, qq, line,
          viber, instagram, linkedin, tiktok, quick_email
        ) VALUES (
          ${userId}, ${externalEmail || null}, ${country || null}, ${city || null}, ${address || null},
          ${wechat || null}, ${whatsapp || null}, ${telegram || null}, ${messenger || null},
          ${skype || null}, ${qq || null}, ${line || null}, ${viber || null}, ${instagram || null},
          ${linkedin || null}, ${tiktok || null}, ${quickEmail || null}
        )
      `);
    } else {
      // 更新 profile
      await db.execute(sql`
        UPDATE user_profiles SET
          external_email = ${externalEmail || null},
          country = ${country || null},
          city = ${city || null},
          address = ${address || null},
          wechat = ${wechat || null},
          whatsapp = ${whatsapp || null},
          telegram = ${telegram || null},
          messenger = ${messenger || null},
          skype = ${skype || null},
          qq = ${qq || null},
          line = ${line || null},
          viber = ${viber || null},
          instagram = ${instagram || null},
          linkedin = ${linkedin || null},
          tiktok = ${tiktok || null},
          quick_email = ${quickEmail || null},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
