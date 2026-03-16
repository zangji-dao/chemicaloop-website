import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * GET /api/admin/spu/list/stats
 * 获取 SPU 统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);

    // 按状态统计 SPU (products 表)
    const spuStatsResult = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM products
      GROUP BY status
    `);

    // 转换为对象格式
    const spuStats: Record<string, number> = {};
    let totalSpu = 0;
    
    for (const row of spuStatsResult.rows) {
      const { status, count } = row as any;
      spuStats[status] = parseInt(count);
      totalSpu += parseInt(count);
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: totalSpu,
        active: spuStats['ACTIVE'] || 0,
        inactive: spuStats['INACTIVE'] || 0,
        pending: spuStats['PENDING'] || 0,
        rejected: spuStats['REJECTED'] || 0,
      },
    });
  } catch (error) {
    console.error('Get SPU stats error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
