import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { withAdminAuth } from '@/lib/withAuth';

/**
 * GET /api/admin/products
 * 获取产品列表（SKU列表，包含SPU信息）
 */
export const GET = withAdminAuth(async (request) => {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;
    
    // 构建查询 - SKU 带上 SPU 信息
    let whereClause = '1=1';
    if (status) {
      whereClause += ` AND sku.status = '${status.replace(/'/g, "''")}'`;
    }
    if (search) {
      whereClause += ` AND (sku.cas ILIKE '%${search.replace(/'/g, "''")}%' OR sku.name ILIKE '%${search.replace(/'/g, "''")}%' OR spu.name ILIKE '%${search.replace(/'/g, "''")}%')`;
    }
    
    const queryText = `
      SELECT 
        sku.*,
        -- SPU 信息
        spu.name as spu_name,
        spu.name_en as spu_name_en,
        spu.formula,
        spu.pubchem_cid,
        spu.molecular_weight,
        spu.boiling_point,
        spu.melting_point,
        spu.flash_point,
        spu.hazard_classes,
        spu.synonyms as spu_synonyms,
        spu.image_url as spu_image_url,
        -- 代理商信息
        u.name as agent_name,
        u.email as agent_email
      FROM agent_products sku
      LEFT JOIN products spu ON sku.spu_id = spu.id
      LEFT JOIN users u ON sku.agent_id = u.id
      WHERE ${whereClause}
      ORDER BY sku.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await db.execute(sql.raw(queryText));
    const productList = result.rows;

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM agent_products sku
      LEFT JOIN products spu ON sku.spu_id = spu.id
      WHERE ${whereClause}
    `;
    const countResult = await db.execute(sql.raw(countQuery));
    const total = parseInt((countResult.rows[0] as any)?.count || '0');

    return NextResponse.json({
      success: true,
      data: productList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/products
 * 创建新产品（先创建/更新SPU，再创建SKU）
 */
export const POST = withAdminAuth(async (request) => {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    const {
      // SPU 信息
      cas,
      name,
      nameEn,
      formula,
      description,
      pubchemCid,
      molecularWeight,
      smiles,
      inchi,
      inchiKey,
      xlogp,
      boilingPoint,
      meltingPoint,
      flashPoint,
      hazardClasses,
      synonyms,
      applications,
      // SKU 信息
      agentId,
      purity,
      packageSpec,
      price,
      minOrder,
      stock,
      stockPublic,
      origin,
      remark,
    } = body;

    // 验证必填字段
    if (!cas || !name || !agentId) {
      return NextResponse.json(
        { success: false, error: 'CAS, name, and agentId are required' },
        { status: 400 }
      );
    }

    // 1. 查找或创建 SPU
    let spuResult = await db.execute(sql`
      SELECT id FROM products WHERE cas = ${cas}
    `);
    
    let spuId: string;
    
    if (spuResult.rows.length === 0) {
      // 创建新的 SPU
      const insertSpuResult = await db.execute(sql`
        INSERT INTO products (cas, name, name_en, formula, description,
          pubchem_cid, molecular_weight, smiles, inchi, inchi_key, xlogp,
          boiling_point, melting_point, flash_point, hazard_classes, synonyms, applications)
        VALUES (${cas}, ${name}, ${nameEn || null}, ${formula || null}, ${description || null},
          ${pubchemCid || null}, ${molecularWeight || null}, ${smiles || null},
          ${inchi || null}, ${inchiKey || null}, ${xlogp || null},
          ${boilingPoint || null}, ${meltingPoint || null}, ${flashPoint || null},
          ${hazardClasses || null}, ${synonyms ? JSON.stringify(synonyms) : null}::jsonb,
          ${applications && applications.length > 0 ? JSON.stringify(applications) : null}::jsonb)
        RETURNING id
      `);
      spuId = (insertSpuResult.rows[0] as any).id;
    } else {
      spuId = (spuResult.rows[0] as any).id;
    }

    // 2. 创建 SKU
    const insertSkuResult = await db.execute(sql`
      INSERT INTO agent_products (
        spu_id, cas, name, agent_id,
        purity, package_spec, price, min_order, stock, stock_public,
        origin, remark, status
      ) VALUES (
        ${spuId}, ${cas}, ${name}, ${agentId},
        ${purity || null}, ${packageSpec || null}, ${price || null},
        ${minOrder || null}, ${stock || null}, ${stockPublic !== undefined ? stockPublic : true},
        ${origin || null}, ${remark || null}, 'approved'
      )
      RETURNING *
    `);

    return NextResponse.json({
      success: true,
      data: insertSkuResult.rows[0],
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
});
