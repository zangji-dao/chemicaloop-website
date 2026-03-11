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
 * 更新产品信息
 * PUT /api/agent/products/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const db = await getDb(schema);

    // 验证产品所有权
    const productResult = await db.execute(sql`
      SELECT agent_id FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 });
    }

    if ((productResult.rows[0] as any).agent_id !== userId) {
      return NextResponse.json({ success: false, error: '无权操作此产品' }, { status: 403 });
    }

    const body = await request.json();
    const { cas, name, purity, packageSpec, price, minOrder, stock, stockPublic, origin, remark } = body;

    // 更新产品
    await db.execute(sql`
      UPDATE agent_products SET
        cas = COALESCE(${cas || null}, cas),
        name = COALESCE(${name || null}, name),
        purity = ${purity || null},
        package_spec = ${packageSpec || null},
        price = ${price || null},
        min_order = ${minOrder || null},
        stock = ${stock || null},
        stock_public = ${stockPublic !== undefined ? stockPublic : true},
        origin = ${origin || null},
        remark = ${remark || null},
        updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({ success: true, message: '产品更新成功' });
  } catch (error: any) {
    console.error('Update agent product error:', error);
    return NextResponse.json({ success: false, error: '更新产品失败' }, { status: 500 });
  }
}

/**
 * 删除产品
 * DELETE /api/agent/products/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const db = await getDb(schema);

    // 验证产品所有权
    const productResult = await db.execute(sql`
      SELECT agent_id FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 });
    }

    if ((productResult.rows[0] as any).agent_id !== userId) {
      return NextResponse.json({ success: false, error: '无权操作此产品' }, { status: 403 });
    }

    // 删除产品
    await db.execute(sql`
      DELETE FROM agent_products WHERE id = ${id}
    `);

    return NextResponse.json({ success: true, message: '产品已删除' });
  } catch (error: any) {
    console.error('Delete agent product error:', error);
    return NextResponse.json({ success: false, error: '删除产品失败' }, { status: 500 });
  }
}

/**
 * 切换产品上下架状态
 * PATCH /api/agent/products/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const db = await getDb(schema);

    // 验证产品所有权
    const productResult = await db.execute(sql`
      SELECT agent_id, status FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 });
    }

    const product = productResult.rows[0] as any;
    if (product.agent_id !== userId) {
      return NextResponse.json({ success: false, error: '无权操作此产品' }, { status: 403 });
    }

    // 切换状态
    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    await db.execute(sql`
      UPDATE agent_products SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      data: { status: newStatus },
      message: newStatus === 'active' ? '产品已上架' : '产品已下架',
    });
  } catch (error: any) {
    console.error('Toggle product status error:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}
