import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * 检查用户名是否可用
 * POST /api/profile/check-username
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, currentUserId } = body;

    if (!username || username.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '用户名至少需要2个字符'
      });
    }

    // 检查用户名长度限制
    if (username.length > 50) {
      return NextResponse.json({
        success: false,
        error: '用户名不能超过50个字符'
      });
    }

    const db = await getDb(schema);

    // 检查用户名是否已存在
    const result = await db.execute(sql`
      SELECT id FROM users WHERE username = ${username} AND id != ${currentUserId || '00000000-0000-0000-0000-000000000000'}
    `);

    return NextResponse.json({
      success: true,
      available: result.rows.length === 0
    });
  } catch (error: any) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check username' },
      { status: 500 }
    );
  }
}
