import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * POST /api/admin/products/listing
 * 创建产品上架记录（SKU）
 * 前置条件：SPU 已保存
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const {
      spuId,
      cas,
      name,
      nameEn,
      formula,
      pubchemCid,
      molecularWeight,
      generatedImageUrl,
      hsCode,
      translations,
      price,
      stock,
      minOrder,
      deliveryTime,
    } = body;

    // 验证必填字段
    if (!cas || !name || !price || !stock || !minOrder || !deliveryTime) {
      return NextResponse.json(
        { success: false, error: 'CAS, name, price, stock, minOrder, and deliveryTime are required' },
        { status: 400 }
      );
    }

    // 获取当前代理商ID（从请求头或session中获取）
    // 这里暂时使用一个固定的代理商ID进行测试
    // 实际应用中应该从认证信息中获取
    let agentId = '00000000-0000-0000-0000-000000000001'; // 默认测试代理商
    
    // 尝试从请求头获取用户信息
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 实际应用中应该解析token获取用户ID
      // 这里暂时使用默认值
    }

    // 确保 SPU 存在
    let finalSpuId = spuId;
    
    if (!finalSpuId) {
      // 查找现有 SPU
      const existingSpu = await db.execute(sql`
        SELECT id FROM products WHERE cas = ${cas}
      `);
      
      if (existingSpu.rows.length > 0) {
        finalSpuId = (existingSpu.rows[0] as any).id;
      } else {
        // 创建新 SPU（如果不存在）
        const newSpuResult = await db.execute(sql`
          INSERT INTO products (
            cas, name, name_en, formula, 
            pubchem_cid, molecular_weight, image_url, hs_code, translations,
            status, created_at, updated_at
          ) VALUES (
            ${cas}, ${name}, ${nameEn || null}, ${formula || null},
            ${pubchemCid || null}, ${molecularWeight || null}, ${generatedImageUrl || null},
            ${hsCode || null}, ${translations ? JSON.stringify(translations) : null}::jsonb,
            'ACTIVE', NOW(), NOW()
          )
          RETURNING id
        `);
        finalSpuId = (newSpuResult.rows[0] as any).id;
      }
    }

    // 检查该代理商是否已有该产品的上架记录
    const existingSku = await db.execute(sql`
      SELECT id FROM agent_products WHERE spu_id = ${finalSpuId} AND agent_id = ${agentId}
    `);

    if (existingSku.rows.length > 0) {
      // 更新现有上架记录
      const skuId = (existingSku.rows[0] as any).id;
      
      await db.execute(sql`
        UPDATE agent_products SET
          name = ${name},
          price = ${price},
          stock = ${stock},
          min_order = ${minOrder},
          delivery_time = ${deliveryTime},
          image_url = COALESCE(${generatedImageUrl || null}, image_url),
          updated_at = NOW()
        WHERE id = ${skuId}
      `);

      return NextResponse.json({
        success: true,
        data: { id: skuId, spuId: finalSpuId, updated: true },
        message: 'Listing updated successfully',
      });
    } else {
      // 创建新的上架记录
      const insertResult = await db.execute(sql`
        INSERT INTO agent_products (
          spu_id, cas, name, agent_id,
          price, stock, min_order, delivery_time,
          image_url, status, created_at, updated_at
        ) VALUES (
          ${finalSpuId}, ${cas}, ${name}, ${agentId},
          ${price}, ${stock}, ${minOrder}, ${deliveryTime},
          ${generatedImageUrl || null}, 'approved', NOW(), NOW()
        )
        RETURNING id
      `);

      const newSkuId = (insertResult.rows[0] as any).id;

      return NextResponse.json({
        success: true,
        data: { id: newSkuId, spuId: finalSpuId, created: true },
        message: 'Listing created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
