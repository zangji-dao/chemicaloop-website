import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { syncProductWithTranslations } from '@/services/productSyncService';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * 获取 SPU 申请详情
 * GET /api/admin/spu/request/[id]/review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { id } = await params;
    const db = await getDb(schema);

    // 获取 SPU 申请详情
    const result = await db.execute(sql`
      SELECT 
        p.*,
        u.name as submitter_name, u.email as submitter_email,
        reviewer.name as reviewer_name
      FROM products p
      LEFT JOIN users u ON p.submitted_by = u.id
      LEFT JOIN users reviewer ON p.reviewed_by = reviewer.id
      WHERE p.id = ${id}
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'SPU 申请不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Get SPU request detail error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取详情失败',
    }, { status: 500 });
  }
}

/**
 * 审核 SPU 申请 - 通过/拒绝
 * POST /api/admin/spu/request/[id]/review
 * 
 * Body: 
 * - status: 'ACTIVE' | 'REJECTED'
 * - review_note?: string
 * - syncPubchem?: boolean (默认 true，通过时自动同步 PubChem 数据)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { id } = await params;
    const body = await request.json();
    const { status, review_note, syncPubchem = true } = body;

    const validStatuses = ['ACTIVE', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    const db = await getDb(schema);

    // 获取 SPU 申请信息
    const spuResult = await db.execute(sql`
      SELECT id, cas, name, status FROM products WHERE id = ${id}
    `);

    if (spuResult.rows.length === 0) {
      return NextResponse.json({ error: 'SPU 申请不存在' }, { status: 404 });
    }

    const spu = spuResult.rows[0] as any;

    // 如果当前状态不是 PENDING，不允许审核
    if (spu.status !== 'PENDING') {
      return NextResponse.json({ error: '该申请已被审核' }, { status: 400 });
    }

    let syncResult: any = null;

    // 审核通过时，可选择同步 PubChem 数据
    if (status === 'ACTIVE' && syncPubchem) {
      console.log(`[SPU Review] Syncing PubChem for CAS: ${spu.cas}`);
      
      syncResult = await syncProductWithTranslations(spu.cas, spu.name);
      
      if (!syncResult.success) {
        console.log(`[SPU Review] PubChem sync failed: ${syncResult.error}`);
        // 即使同步失败，仍然通过审核，只是记录日志
      }
    }

    // 更新 SPU 状态
    await db.execute(sql`
      UPDATE products 
      SET status = ${status},
          review_note = ${review_note || null},
          reviewed_by = ${auth.userId},
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: status === 'ACTIVE' ? '审核通过，SPU 已激活' : '已拒绝',
      syncResult: syncResult ? {
        success: syncResult.success,
        translations: syncResult.translations,
      } : null,
    });
  } catch (error: any) {
    console.error('Review SPU request error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '审核失败',
    }, { status: 500 });
  }
}
