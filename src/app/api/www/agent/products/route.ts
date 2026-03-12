import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { verifyAgent, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * 获取代理商的产品列表
 * GET /api/agent/products
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAgent(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const userId = auth.userId;
    const db = await getDb(schema);

    // 获取搜索参数
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // 构建查询
    let query = sql`
      SELECT 
        ap.id, ap.cas, ap.name, ap.purity, ap.package_spec, ap.price, 
        ap.min_order, ap.stock, ap.stock_public, ap.origin, ap.remark, ap.status,
        ap.created_at, ap.updated_at
      FROM agent_products ap
      WHERE ap.agent_id = ${userId}
    `;

    if (search) {
      query = sql`
        SELECT 
          ap.id, ap.cas, ap.name, ap.purity, ap.package_spec, ap.price, 
          ap.min_order, ap.stock, ap.stock_public, ap.origin, ap.remark, ap.status,
          ap.created_at, ap.updated_at
        FROM agent_products ap
        WHERE ap.agent_id = ${userId}
        AND (ap.cas ILIKE ${`%${search}%`} OR ap.name ILIKE ${`%${search}%`})
      `;
    }

    if (status) {
      query = sql`
        ${query} AND ap.status = ${status}
      `;
    }

    query = sql`${query} ORDER BY ap.created_at DESC`;

    const result = await db.execute(query);

    return NextResponse.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        cas: row.cas,
        name: row.name,
        purity: row.purity,
        packageSpec: row.package_spec,
        price: row.price,
        minOrder: row.min_order,
        stock: row.stock,
        stockPublic: row.stock_public,
        origin: row.origin,
        remark: row.remark,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Get agent products error:', error);
    return NextResponse.json({ success: false, error: '获取产品列表失败' }, { status: 500 });
  }
}

/**
 * 上架新产品
 * POST /api/agent/products
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAgent(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const userId = auth.userId;
    const db = await getDb(schema);

    const body = await request.json();
    const { cas, name, purity, packageSpec, price, minOrder, stock, stockPublic, origin, remark } = body;

    // 验证必填字段
    if (!cas || !name) {
      return NextResponse.json({ success: false, error: 'CAS码和产品名称为必填项' }, { status: 400 });
    }

    // 插入新产品（状态为 pending，需要管理员审核）
    const result = await db.execute(sql`
      INSERT INTO agent_products (
        agent_id, cas, name, purity, package_spec, price, min_order, stock, stock_public, origin, remark, status
      ) VALUES (
        ${userId}, ${cas}, ${name}, ${purity || null}, ${packageSpec || null}, ${price || null},
        ${minOrder || null}, ${stock || null}, ${stockPublic !== false}, ${origin || null}, ${remark || null}, 'pending'
      )
      RETURNING id
    `);

    return NextResponse.json({
      success: true,
      data: { id: (result.rows[0] as any).id },
      message: '产品已提交，等待审核',
    });
  } catch (error: any) {
    console.error('Create agent product error:', error);
    return NextResponse.json({ success: false, error: '上架产品失败' }, { status: 500 });
  }
}
