import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * POST /api/supply-inquiries
 * 提交供货信息或采购询价
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const {
      type, // 'supply' | 'purchase'
      productId,
      cas,
      productName,
      ...formData
    } = body;
    
    // 验证必填字段
    if (!type || !cas) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 获取当前用户 ID（从 token 或 session）
    // 这里暂时使用默认值，实际应从认证中间件获取
    const userId = 'system';
    
    // 构建询价数据
    const inquiryData = {
      type,
      product_id: productId || null,
      cas,
      product_name: productName,
      form_data: JSON.stringify(formData),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // 插入数据库
    const result = await db.execute(sql`
      INSERT INTO supply_inquiries (
        type, product_id, cas, product_name, form_data, status, created_at, updated_at
      ) VALUES (
        ${inquiryData.type},
        ${inquiryData.product_id},
        ${inquiryData.cas},
        ${inquiryData.product_name},
        ${inquiryData.form_data},
        ${inquiryData.status},
        ${inquiryData.created_at},
        ${inquiryData.updated_at}
      )
      RETURNING id
    `);
    
    return NextResponse.json({
      success: true,
      data: { id: result.rows[0].id },
      message: type === 'supply' ? 'Supply information submitted' : 'Purchase inquiry submitted',
    });
  } catch (error) {
    console.error('Submit supply/purchase inquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/supply-inquiries
 * 获取供货/采购询价列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (type !== 'all') {
      whereClause += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    if (status !== 'all') {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    // 查询总数
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM supply_inquiries WHERE ${sql.raw(whereClause)}
    `);
    const total = parseInt(countResult.rows[0].total as string);
    
    // 查询列表
    const listResult = await db.execute(sql`
      SELECT * FROM supply_inquiries WHERE ${sql.raw(whereClause)} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `);
    
    return NextResponse.json({
      success: true,
      data: listResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get supply/purchase inquiries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}
