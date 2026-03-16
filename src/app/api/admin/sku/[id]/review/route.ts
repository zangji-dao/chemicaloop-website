import { NextRequest, NextResponse } from 'next/server';
import { S3Storage, getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { syncProductWithTranslations } from '@/services/productSyncService';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * 预审 SKU 产品 - 快速返回产品信息，检查 SPU 状态
 * GET /api/admin/sku/[id]/review
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

    // 获取代理商产品信息
    const productResult = await db.execute(sql`
      SELECT 
        ap.id, ap.cas, ap.name, ap.purity, ap.package_spec, ap.price,
        ap.min_order, ap.stock, ap.stock_public, ap.origin, ap.status, ap.remark,
        ap.spu_id, ap.image_key,
        u.name as agent_name, u.email as agent_email
      FROM agent_products ap
      JOIN users u ON ap.agent_id = u.id
      WHERE ap.id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    const product = productResult.rows[0] as any;

    // 检查 SPU (products 表) 是否已存在该 CAS 码
    const spuResult = await db.execute(sql`
      SELECT 
        id, name, name_en, description, translations, image_url,
        pubchem_cid, synonyms, applications
      FROM products 
      WHERE cas = ${product.cas}
    `);

    const existingSpu = spuResult.rows[0] as any;

    // 如果 SPU 已存在且有图片
    if (existingSpu && existingSpu.image_url) {
      return NextResponse.json({
        success: true,
        product,
        spu: {
          id: existingSpu.id,
          exists: true,
          hasImage: true,
          imageUrl: existingSpu.image_url,
          hasTranslations: existingSpu.translations && Object.keys(existingSpu.translations).length > 0,
          name: existingSpu.name,
          nameEn: existingSpu.name_en,
          pubchemCid: existingSpu.pubchem_cid,
        },
      });
    }

    // 新 CAS 码，返回需要同步 PubChem 的标记
    return NextResponse.json({
      success: true,
      product,
      spu: {
        id: existingSpu?.id || null,
        exists: !!existingSpu,
        hasImage: false,
        needsSync: true, // 标记需要同步 PubChem
        needsTranslation: !existingSpu?.translations || Object.keys(existingSpu.translations || {}).length === 0,
      },
    });
  } catch (error: any) {
    console.error('Review product error:', error);
    return NextResponse.json({
      success: false,
      error: '审核失败',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * 审核 SKU 产品 - 通过/拒绝，自动同步 PubChem 和翻译
 * POST /api/admin/sku/[id]/review
 * Body: { status: 'approved' | 'rejected', review_note?: string }
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
    const { status, review_note, skipSync } = body;

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    const db = await getDb(schema);

    // 获取代理商产品信息
    const productResult = await db.execute(sql`
      SELECT id, cas, name, agent_id FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    const agentProduct = productResult.rows[0] as any;
    let spuId: string | null = null;
    let syncResult: any = null;

    // 审核通过时，同步 SPU 和翻译
    if (status === 'approved' && !skipSync) {
      console.log(`[Review] Syncing SPU for CAS: ${agentProduct.cas}`);
      
      syncResult = await syncProductWithTranslations(
        agentProduct.cas,
        agentProduct.name
      );
      
      if (syncResult.success && syncResult.productId) {
        spuId = syncResult.productId;
        console.log(`[Review] SPU synced: ${spuId}`);
      } else {
        console.log(`[Review] SPU sync failed: ${syncResult.error}`);
      }
    }

    // 更新代理商产品状态
    await db.execute(sql`
      UPDATE agent_products 
      SET status = ${status}, 
          review_note = ${review_note || null}, 
          reviewed_at = NOW(), 
          reviewed_by = ${auth.userId},
          spu_id = ${spuId},
          updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? '审核通过' : '已拒绝',
      spuId,
      translations: syncResult?.translations,
    });
  } catch (error: any) {
    console.error('Update product status error:', error);
    return NextResponse.json({
      success: false,
      error: '审核失败',
    }, { status: 500 });
  }
}
