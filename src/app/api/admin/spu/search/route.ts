import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * GET /api/admin/spu/search?q=cas_number
 * 搜索本地 SPU 数据库
 * 根据 CAS 号查询产品是否存在
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const db = await getDb(schema);

    // 根据 CAS 号精确查询
    const result = await db.execute(sql`
      SELECT 
        id,
        cas,
        name,
        name_en,
        formula,
        status,
        image_url,
        structure_image_key
      FROM products
      WHERE cas = ${query}
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return NextResponse.json({
        success: true,
        data: [{
          id: row.id,
          cas: row.cas,
          name: row.name,
          name_en: row.name_en,
          formula: row.formula,
          status: row.status,
          imageUrl: row.image_url,
          structureImageKey: row.structure_image_key,
        }],
      });
    }

    // 未找到
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('SPU search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Search failed',
    }, { status: 500 });
  }
}
