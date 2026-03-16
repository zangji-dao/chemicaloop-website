import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * GET /api/admin/spu/request/list
 * 获取 SPU 申请列表（status = 'PENDING'）
 * 
 * Query params:
 * - page: 页码 (默认 1)
 * - limit: 每页数量 (默认 20)
 * - status: 状态筛选 (PENDING | ACTIVE | REJECTED)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'PENDING';
    const offset = (page - 1) * limit;

    const db = await getDb(schema);

    // 获取 SPU 申请列表
    const result = await db.execute(sql`
      SELECT 
        p.id, p.cas, p.name, p.name_en, p.formula, p.status,
        p.created_at, p.updated_at,
        p.submitted_by, p.review_note, p.reviewed_at,
        u.name as submitter_name, u.email as submitter_email,
        reviewer.name as reviewer_name
      FROM products p
      LEFT JOIN users u ON p.submitted_by = u.id
      LEFT JOIN users reviewer ON p.reviewed_by = reviewer.id
      WHERE p.status = ${status}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // 获取总数
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM products
      WHERE status = ${status}
    `);

    const total = parseInt((countResult.rows[0] as any)?.total || '0');

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get SPU request list error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取列表失败',
    }, { status: 500 });
  }
}
