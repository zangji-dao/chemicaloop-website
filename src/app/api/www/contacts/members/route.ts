import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { getUserIdFromToken } from '@/lib/tokenUtils';

/**
 * 获取当前用户的联系人列表
 * GET /api/contact-members
 * 
 * 返回与当前用户建立了联系的用户列表
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb(schema);

    // 从 contact_members 表获取联系人列表
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.name,
        u.avatar_url as "avatarUrl",
        cm.id as "contactMemberId",
        cm.contact_details as "contactDetails",
        cm.created_at as "connectedAt"
      FROM contact_members cm
      INNER JOIN users u ON u.id = cm.contact_user_id
      WHERE cm.user_id = ${userId}::uuid
      ORDER BY cm.created_at DESC
    `);

    const members = result.rows.map((member: any) => ({
      id: member.id,
      email: member.email,
      username: member.username,
      name: member.name,
      avatarUrl: member.avatarUrl,
      contactMemberId: member.contactMemberId,
      contactDetails: member.contactDetails,
      connectedAt: member.connectedAt,
      // 前端兼容字段
      contactUserId: member.id,
      userName: member.name,
      userEmail: member.email,
    }));

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error: any) {
    console.error('[Contact] Get contact members error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get contact members' },
      { status: 500 }
    );
  }
}
