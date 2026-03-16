import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * PUT /api/admin/sku/review/batch-status
 * 批量更新产品状态
 */
export async function PUT(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要更新的产品' }, { status: 400 });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: '无效的状态' }, { status: 400 });
    }

    // 构建批量更新
    const idList = ids.map((id: string) => `'${id.replace(/'/g, "''")}'`).join(',');
    
    await db.execute(sql.raw(`
      UPDATE agent_products 
      SET status = '${status}', updated_at = NOW()
      WHERE id IN (${idList})
    `));

    return NextResponse.json({
      success: true,
      message: `已更新 ${ids.length} 个产品的状态`,
    });
  } catch (error) {
    console.error('Batch update product status error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
