import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { verifyAgent, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * 重新提交审核
 * POST /api/agent/products/[id]/resubmit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAgent(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const userId = auth.userId;
    const { id } = await params;
    const db = await getDb(schema);

    // 验证产品是否属于该代理商
    const productResult = await db.execute(sql`
      SELECT id, status FROM agent_products WHERE id = ${id} AND agent_id = ${userId}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 });
    }

    const product = productResult.rows[0] as any;
    
    // 只有被拒绝的产品可以重新提交
    if (product.status !== 'rejected') {
      return NextResponse.json({ success: false, error: '只有被拒绝的产品可以重新提交' }, { status: 400 });
    }

    // 更新状态为 pending
    await db.execute(sql`
      UPDATE agent_products 
      SET status = 'pending', review_note = null, updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: '已重新提交审核',
    });
  } catch (error: any) {
    console.error('Resubmit product error:', error);
    return NextResponse.json({ success: false, error: '重新提交失败' }, { status: 500 });
  }
}
