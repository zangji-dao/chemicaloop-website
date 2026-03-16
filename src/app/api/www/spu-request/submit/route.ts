import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { verifyUser, unauthorizedResponse } from '@/lib/auth';

/**
 * POST /api/www/spu-request/submit
 * 用户提交 SPU 申请（新增化学品申请）
 * 
 * Body:
 * - cas: string (必填)
 * - name: string (必填)
 * - nameEn?: string
 * - formula?: string
 * - description?: string
 * - remark?: string (申请备注)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyUser(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error);
    }

    const body = await request.json();
    const { cas, name, nameEn, formula, description, remark } = body;

    // 验证必填字段
    if (!cas || !name) {
      return NextResponse.json(
        { success: false, error: 'CAS 号和名称为必填项' },
        { status: 400 }
      );
    }

    // 验证 CAS 号格式 (基本格式: X-X-X)
    const casPattern = /^\d{2,7}-\d{2}-\d$/;
    if (!casPattern.test(cas)) {
      return NextResponse.json(
        { success: false, error: 'CAS 号格式不正确' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 检查 CAS 是否已存在
    const existingResult = await db.execute(sql`
      SELECT id, status FROM products WHERE cas = ${cas}
    `);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0] as any;
      
      // 如果已存在且状态为 ACTIVE，提示用户
      if (existing.status === 'ACTIVE') {
        return NextResponse.json({
          success: false,
          error: '该化学品已存在，请直接搜索使用',
          code: 'SPU_EXISTS',
        }, { status: 400 });
      }
      
      // 如果已存在但状态为 PENDING，提示用户已提交过申请
      if (existing.status === 'PENDING') {
        return NextResponse.json({
          success: false,
          error: '该化学品的申请已提交，请等待审核',
          code: 'SPU_PENDING',
        }, { status: 400 });
      }
    }

    // 创建 SPU 申请
    const insertResult = await db.execute(sql`
      INSERT INTO products (
        cas, name, name_en, formula, description,
        status, submitted_by, review_note,
        created_at, updated_at
      ) VALUES (
        ${cas}, ${name}, ${nameEn || null}, ${formula || null}, ${description || null},
        'PENDING', ${auth.userId}, ${remark || null},
        NOW(), NOW()
      )
      RETURNING id
    `);

    const newSpuId = (insertResult.rows[0] as any).id;

    return NextResponse.json({
      success: true,
      message: 'SPU 申请已提交，请等待管理员审核',
      data: {
        id: newSpuId,
        cas,
        name,
      },
    });
  } catch (error: any) {
    console.error('Submit SPU request error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '提交失败',
    }, { status: 500 });
  }
}

/**
 * GET /api/www/spu-request/submit
 * 检查用户提交的 SPU 申请状态
 * 
 * Query params:
 * - cas: string (CAS 号)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyUser(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const cas = searchParams.get('cas');

    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS 号为必填项' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 查询用户提交的该 CAS 申请状态
    const result = await db.execute(sql`
      SELECT id, cas, name, status, created_at, reviewed_at, review_note
      FROM products
      WHERE cas = ${cas} AND submitted_by = ${auth.userId}
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '未找到该 CAS 的申请记录',
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Check SPU request status error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '查询失败',
    }, { status: 500 });
  }
}
