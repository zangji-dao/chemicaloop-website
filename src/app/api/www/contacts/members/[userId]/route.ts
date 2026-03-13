import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { getUserIdFromToken } from '@/lib/tokenUtils';

/**
 * 获取指定联系人的详细信息
 * GET /api/contact-members/[userId]
 * 
 * 返回指定用户的公开联系方式（仅限已建立联系的用户）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: contactUserId } = await params;
    const db = await getDb(schema);

    // 从 contact_members 表验证是否已建立联系
    const connectionResult = await db.execute(sql`
      SELECT id, contact_details, created_at as "connectedAt"
      FROM contact_members
      WHERE user_id = ${currentUserId}::uuid 
        AND contact_user_id = ${contactUserId}::uuid
      LIMIT 1
    `);

    if (connectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not connected with this user' },
        { status: 403 }
      );
    }

    const connection = connectionResult.rows[0];

    // 获取联系人基本信息
    const userResult = await db.execute(sql`
      SELECT 
        id,
        email,
        username,
        name,
        avatar_url as "avatarUrl"
      FROM users
      WHERE id = ${contactUserId}::uuid
    `);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取用户个人资料
    const profileResult = await db.execute(sql`
      SELECT 
        country,
        city,
        address,
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
        qq,
        quick_email as "quickEmail"
      FROM user_profiles
      WHERE user_id = ${contactUserId}::uuid
    `);

    // 组装 profile，添加 location 字段
    const profileData = profileResult.rows[0] || {};
    const location = [profileData.city, profileData.country].filter(Boolean).join(', ') || null;

    const contact = {
      ...userResult.rows[0],
      socialContacts: connection.contact_details || {},
      connectedAt: connection.connectedAt,
      profile: {
        ...profileData,
        location,
      },
    };

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error('[Contact] Get contact profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get contact profile' },
      { status: 500 }
    );
  }
}

/**
 * 删除联系人（移除联系关系）
 * DELETE /api/contact-members/[userId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: contactUserId } = await params;
    const db = await getDb(schema);

    // 从 contact_members 表删除联系人关系
    await db.execute(sql`
      DELETE FROM contact_members
      WHERE user_id = ${currentUserId}::uuid 
        AND contact_user_id = ${contactUserId}::uuid
    `);

    return NextResponse.json({
      success: true,
      message: 'Contact removed successfully',
    });
  } catch (error: any) {
    console.error('[Contact] Delete contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
