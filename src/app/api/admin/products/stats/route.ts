import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * GET /api/admin/products/stats
 * 获取产品统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);

    // 按状态统计
    const statsResult = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM agent_products
      GROUP BY status
    `);

    // 转换为对象格式
    const stats: Record<string, number> = {};
    let total = 0;
    
    for (const row of statsResult.rows) {
      const { status, count } = row as any;
      stats[status] = parseInt(count);
      total += parseInt(count);
    }

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending: stats['pending'] || 0,
        approved: stats['approved'] || 0,
        rejected: stats['rejected'] || 0,
        active: stats['active'] || 0,
        inactive: stats['inactive'] || 0,
      },
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
