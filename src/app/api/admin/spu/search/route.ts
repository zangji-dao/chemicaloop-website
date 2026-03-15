import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { eq } from 'drizzle-orm';
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

    // 使用 Drizzle ORM 查询构建器，更高效
    const result = await db
      .select({
        id: schema.products.id,
        cas: schema.products.cas,
        name: schema.products.name,
        nameEn: schema.products.nameEn,
        formula: schema.products.formula,
        status: schema.products.status,
        imageUrl: schema.products.imageUrl,
        structureImageKey: schema.products.structureImageKey,
      })
      .from(schema.products)
      .where(eq(schema.products.cas, query))
      .limit(1);

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        data: [result[0]],
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
