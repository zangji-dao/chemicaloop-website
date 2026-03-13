import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * PUT /api/admin/products/[id]/status
 * 更新产品状态
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb(schema);
    const { id } = await params;
    const body = await request.json();
    const { status, reviewNote } = body;

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: '无效的状态' }, { status: 400 });
    }

    // 检查产品是否存在
    const productResult = await db.execute(sql`
      SELECT id FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 });
    }

    // 更新状态
    await db.execute(sql`
      UPDATE agent_products 
      SET status = ${status}, 
          review_note = ${reviewNote || null},
          updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: '状态更新成功',
    });
  } catch (error) {
    console.error('Update product status error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
