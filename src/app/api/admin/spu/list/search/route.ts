import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { eq, or, like } from 'drizzle-orm';
import * as schema from '@/db';
import { withAdminAuth } from '@/lib/withAuth';

/**
 * GET /api/admin/spu/list/search?q=cas_number&cas=cas_number
 * 搜索本地 SPU 数据库
 * 支持：
 * - q 参数：通用搜索（CAS号或名称模糊匹配）
 * - cas 参数：精确匹配 CAS 号，返回完整产品数据
 */
export const GET = withAdminAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const cas = searchParams.get('cas')?.trim();

    const db = await getDb(schema);

    // 如果提供了 cas 参数，返回完整产品数据
    if (cas) {
      const result = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.cas, cas))
        .limit(1);

      if (result.length > 0) {
        return NextResponse.json({
          success: true,
          data: result[0],
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Product not found',
      }, { status: 404 });
    }

    // 如果提供了 q 参数，返回简要搜索结果
    if (query) {
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
          productImageKey: schema.products.productImageKey,
          molecularWeight: schema.products.molecularWeight,
        })
        .from(schema.products)
        .where(
          or(
            eq(schema.products.cas, query),
            like(schema.products.cas, `%${query}%`),
            like(schema.products.name, `%${query}%`),
            like(schema.products.nameEn, `%${query}%`)
          )
        )
        .limit(20);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

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
});
