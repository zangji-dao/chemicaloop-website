import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import jwt from 'jsonwebtoken';

// 从 token 中解析用户 ID
function getUserIdFromToken(request: NextRequest): string | null {
  // 优先从 x-user-id header 获取
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // 从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * 设置/修改用户名
 * POST /api/profile/set-username
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求头或 token 获取用户ID
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username } = body;

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

    // 检查用户是否存在
    const userResult = await db.execute(sql`
      SELECT username FROM users WHERE id = ${userId}
    `);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查用户名是否已被其他用户使用
    const existingUser = await db.execute(sql`
      SELECT id FROM users WHERE username = ${username} AND id != ${userId}
    `);

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: '该用户名已被使用'
      });
    }

    // 更新用户名（允许修改）
    await db.execute(sql`
      UPDATE users SET username = ${username}, updated_at = NOW() WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Username updated successfully',
      data: {
        username: username
      }
    });
  } catch (error: any) {
    console.error('Set username error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set username' },
      { status: 500 }
    );
  }
}
