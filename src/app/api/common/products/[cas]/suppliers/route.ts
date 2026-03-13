import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * 根据CAS码查询所有供应商报价
 * GET /api/products/:cas/suppliers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cas: string }> }
) {
  try {
    const { cas } = await params;

    if (!cas) {
      return NextResponse.json({ success: false, error: '请提供CAS码' }, { status: 400 });
    }

    const db = await getDb(schema);

    // 查询该CAS码所有在售产品的代理商信息
    const result = await db.execute(sql`
      SELECT 
        ap.id as product_id,
        ap.cas,
        ap.name,
        ap.purity,
        ap.package_spec,
        ap.price,
        ap.min_order,
        ap.stock,
        ap.stock_public,
        ap.origin,
        u.id as agent_id,
        u.name as agent_name,
        u.username as agent_username,
        up.country,
        up.city,
        up.wechat,
        up.whatsapp,
        up.telegram,
        up.messenger,
        up.line,
        up.viber
      FROM agent_products ap
      JOIN users u ON ap.agent_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ap.cas = ${cas}
        AND ap.status = 'active'
      ORDER BY ap.price ASC NULLS LAST
    `);

    const suppliers = result.rows.map((row: any) => ({
      productId: row.product_id,
      cas: row.cas,
      name: row.name,
      purity: row.purity,
      packageSpec: row.package_spec,
      price: row.price,
      minOrder: row.min_order,
      stock: row.stock_public ? row.stock : null,
      stockPublic: row.stock_public,
      origin: row.origin,
      agent: {
        id: row.agent_id,
        name: row.agent_name,
        username: row.agent_username,
        location: [row.country, row.city].filter(Boolean).join(', '),
      },
      contacts: {
        wechat: row.wechat,
        whatsapp: row.whatsapp,
        telegram: row.telegram,
        messenger: row.messenger,
        line: row.line,
        viber: row.viber,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        cas,
        total: suppliers.length,
        suppliers,
      },
    });
  } catch (error: any) {
    console.error('Query suppliers by CAS error:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}
