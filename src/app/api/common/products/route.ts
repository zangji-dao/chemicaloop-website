import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * GET /api/products
 * 获取已上架产品列表（公开API，无需登录）
 * 
 * Query params:
 * - search: 搜索关键词（CAS、名称）
 * - page: 页码，默认1
 * - limit: 每页数量，默认20
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    
    // 获取请求的语言
    const locale = searchParams.get('locale') || 'zh';

    // 构建搜索条件
    const searchPattern = search ? `%${search.replace(/'/g, "''")}%` : null;
    
    // 优化：使用 LEFT JOIN 显示所有上架的 SPU，即使没有 SKU
    const queryText = `
      SELECT 
        spu.id,
        spu.cas,
        spu.name,
        spu.name_en,
        spu.formula,
        spu.hs_code,
        spu.hs_code_extensions,
        spu.synonyms,
        spu.translations,
        spu.product_image_key,
        COUNT(sku.id) FILTER (WHERE sku.status = 'active') as supplier_count,
        MIN(CAST(sku.price AS DECIMAL)) FILTER (WHERE sku.status = 'active') as price_min,
        MAX(CAST(sku.price AS DECIMAL)) FILTER (WHERE sku.status = 'active') as price_max,
        MIN(sku.image_key) FILTER (WHERE sku.image_key IS NOT NULL AND sku.status = 'active') as image_key
      FROM products spu
        LEFT JOIN agent_products sku ON sku.spu_id = spu.id
      WHERE spu.status = 'ACTIVE'
        ${searchPattern ? `AND (spu.cas ILIKE '${searchPattern}' OR spu.name ILIKE '${searchPattern}' OR spu.name_en ILIKE '${searchPattern}')` : ''}
      GROUP BY spu.id
      ORDER BY supplier_count DESC, spu.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 查询总数 - 统计所有上架的 SPU
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM products
      WHERE status = 'ACTIVE'
      ${searchPattern ? `AND (cas ILIKE '${searchPattern}' OR name ILIKE '${searchPattern}' OR name_en ILIKE '${searchPattern}')` : ''}
    `;

    const [spuResult, countResult] = await Promise.all([
      db.execute(sql.raw(queryText)),
      db.execute(sql.raw(countQuery)),
    ]);

    // 收集所有需要生成签名 URL 的 imageKey（优先 SKU 图片，其次 SPU 产品图）
    const imageKeys = spuResult.rows
      .map((row: any) => row.image_key || row.product_image_key)
      .filter((key: string | null) => key);

    // 批量生成签名 URL（并行）
    let signedUrls: Record<string, string> = {};
    if (imageKeys.length > 0) {
      const storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });

      signedUrls = await Promise.all(
        imageKeys.map(async (key: string) => {
          const url = await storage.generatePresignedUrl({
            key,
            expireTime: 86400,
          });
          return { key, url };
        })
      ).then(results => Object.fromEntries(results.map(r => [r.key, r.url])));
    }

    // 过滤 translations 字段，只保留当前语言
    const filterTranslations = (translations: any) => {
      if (!translations || typeof translations !== 'object') return translations;
      const result: any = {};
      // translations 结构：{ name: { zh: '', en: '' }, description: { zh: '', en: '' } }
      for (const key of Object.keys(translations)) {
        const value = translations[key];
        if (value && typeof value === 'object' && locale in value) {
          result[key] = { [locale]: value[locale] };
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    const spuList = spuResult.rows.map((row: any) => {
      // 优先使用 SKU 图片，其次使用 SPU 产品图
      const imageKey = row.image_key || row.product_image_key;
      return {
        id: row.id,
        cas: row.cas,
        name: row.name,
        nameEn: row.name_en,
        formula: row.formula,
        hsCode: row.hs_code,
        synonyms: row.synonyms,
        translations: filterTranslations(row.translations),
        imageUrl: imageKey ? signedUrls[imageKey] : null,
        supplierCount: parseInt(row.supplier_count || '0', 10),
        priceRange: row.price_min ? {
          min: parseFloat(row.price_min),
          max: parseFloat(row.price_max || row.price_min),
        } : null,
      };
    });

    const total = parseInt((countResult.rows[0] as any)?.count || '0', 10);

    return NextResponse.json({
      success: true,
      data: spuList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
