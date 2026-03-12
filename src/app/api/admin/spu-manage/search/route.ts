import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * GET /api/spu/search
 * 搜索 SPU（代理用）
 * 
 * 查询参数：
 * - q: 搜索关键词（CAS 或名称）
 * - limit: 返回数量限制（默认 10）
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 搜索 CAS 或名称，只返回 ACTIVE 状态的 SPU
    const searchPattern = `%${query.replace(/'/g, "''")}%`;
    
    const result = await db.execute(sql`
      SELECT 
        id,
        cas,
        name,
        name_en,
        formula,
        description,
        hs_code,
        pubchem_cid,
        molecular_weight,
        synonyms,
        applications
      FROM products
      WHERE status = 'ACTIVE'
        AND (
          cas ILIKE ${searchPattern}
          OR name ILIKE ${searchPattern}
          OR name_en ILIKE ${searchPattern}
        )
      ORDER BY 
        CASE 
          WHEN cas = ${query} THEN 0
          WHEN cas ILIKE ${query + '%'} THEN 1
          WHEN name ILIKE ${query + '%'} THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT ${limit}
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error searching SPU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search SPU' },
      { status: 500 }
    );
  }
}
