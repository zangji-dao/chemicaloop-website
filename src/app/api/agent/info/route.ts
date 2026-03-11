import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import jwt from 'jsonwebtoken';

// 从 token 中解析用户 ID
function getUserIdFromToken(request: NextRequest): string | null {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

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
 * 更新代理商信息
 * PUT /api/agent/info
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const db = await getDb(schema);

    // 验证是否为代理商
    const userResult = await db.execute(sql`
      SELECT role FROM users WHERE id = ${userId}
    `);

    if (userResult.rows.length === 0 || (userResult.rows[0] as any).role !== 'AGENT') {
      return NextResponse.json({ success: false, error: '您不是代理商' }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyName,
      contactPerson,
      country,
      city,
      address,
      phone,
      wechat,
      whatsapp,
      telegram,
      messenger,
      line,
      viber,
      website,
      description,
    } = body;

    // 更新 users 表的 name
    if (companyName) {
      await db.execute(sql`
        UPDATE users SET name = ${companyName}, updated_at = NOW() WHERE id = ${userId}
      `);
    }

    // 检查 user_profiles 是否存在
    const profileResult = await db.execute(sql`
      SELECT user_id FROM user_profiles WHERE user_id = ${userId}
    `);

    if (profileResult.rows.length === 0) {
      // 创建新的 profile
      await db.execute(sql`
        INSERT INTO user_profiles (
          user_id, country, city, address, phone, 
          wechat, whatsapp, telegram, messenger, line, viber,
          website, description, created_at, updated_at
        ) VALUES (
          ${userId}, ${country || null}, ${city || null}, ${address || null}, ${phone || null},
          ${wechat || null}, ${whatsapp || null}, ${telegram || null}, ${messenger || null}, 
          ${line || null}, ${viber || null}, ${website || null}, ${description || null},
          NOW(), NOW()
        )
      `);
    } else {
      // 更新现有 profile
      await db.execute(sql`
        UPDATE user_profiles SET
          country = ${country || null},
          city = ${city || null},
          address = ${address || null},
          phone = ${phone || null},
          wechat = ${wechat || null},
          whatsapp = ${whatsapp || null},
          telegram = ${telegram || null},
          messenger = ${messenger || null},
          line = ${line || null},
          viber = ${viber || null},
          website = ${website || null},
          description = ${description || null},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `);
    }

    return NextResponse.json({
      success: true,
      message: '代理商信息已更新',
    });
  } catch (error: any) {
    console.error('Update agent info error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
