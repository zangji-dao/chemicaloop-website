import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { generateChemicalSVG, validateSVG } from '@/services/chemical-svg-generator';
import { withAdminAuth } from '@/lib/withAuth';
import { STORAGE_CONFIG } from '@/lib/env';

// 腾讯云 COS 客户端（虚拟样式域名）
const cosClient = new S3Client({
  region: STORAGE_CONFIG.region,
  endpoint: `https://${STORAGE_CONFIG.bucket}.cos.${STORAGE_CONFIG.region}.myqcloud.com`,
  credentials: {
    accessKeyId: process.env.COS_SECRET_ID || '',
    secretAccessKey: process.env.COS_SECRET_KEY || '',
  },
  forcePathStyle: false, // 使用虚拟样式域名
});

// 上传文件到 COS
async function uploadToCos(key: string, content: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: STORAGE_CONFIG.bucket,
    Key: key,
    Body: content,
    ContentType: contentType,
  });
  await cosClient.send(command);
  return key;
}

// 生成签名 URL
async function getSignedCosUrl(key: string, expireTime: number = 86400): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: STORAGE_CONFIG.bucket,
    Key: key,
  });
  // @ts-ignore - 版本兼容问题
  return getSignedUrl(cosClient, command, { expiresIn: expireTime });
}

/**
 * 生成产品图片 API
 * POST /api/admin/spu/create/generate-image
 * 
 * Body: 
 *   - productId: string (SKU ID - agent_products)
 *   - 或 spuId: string (SPU ID - products)
 *   - 或 cas: string, name: string
 *   - force: boolean (强制重新生成，忽略缓存)
 * 
 * 生成美化版化学结构 SVG 图
 */
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json();
    const { productId, spuId, cas: inputCas, name: inputName, force } = body;

    let cas = inputCas;
    let name = inputName;
    let structureSdf: string | null = null;

    const db = await getDb(schema);

    // 如果提供了 productId (SKU)，获取产品信息
    if (productId) {
      const productResult = await db.execute(sql`
        SELECT ap.cas, ap.name, p.pubchem_cid, p.structure_sdf
        FROM agent_products ap
        LEFT JOIN products p ON p.id = ap.spu_id
        WHERE ap.id = ${productId}
      `);
      
      if (productResult.rows.length === 0) {
        return NextResponse.json({ error: '产品不存在' }, { status: 404 });
      }
      
      const product = productResult.rows[0] as any;
      cas = product.cas;
      name = product.name;
      structureSdf = product.structure_sdf;
    }
    
    // 如果提供了 spuId (SPU)，获取产品信息
    if (spuId) {
      const spuResult = await db.execute(sql`
        SELECT cas, name, pubchem_cid, product_image_key, structure_sdf
        FROM products
        WHERE id = ${spuId}
      `);
      
      if (spuResult.rows.length === 0) {
        return NextResponse.json({ error: 'SPU不存在' }, { status: 404 });
      }
      
      const spu = spuResult.rows[0] as any;
      cas = spu.cas;
      name = spu.name;
      structureSdf = spu.structure_sdf;
      
      // 检查是否已有产品图（除非强制重新生成）
      if (spu.product_image_key && !force) {
        const imageUrl = await getSignedCosUrl(spu.product_image_key);
        return NextResponse.json({
          success: true,
          imageKey: spu.product_image_key,
          imageUrl,
          message: '使用已有图片',
        });
      }
    }

    if (!cas) {
      return NextResponse.json({ error: 'CAS 码不能为空' }, { status: 400 });
    }

    // 检查 SKU 是否已有图片（除非强制重新生成）
    if (productId && !force) {
      const existingResult = await db.execute(sql`
        SELECT image_key FROM agent_products WHERE id = ${productId} AND image_key IS NOT NULL
      `);
      
      if (existingResult.rows.length > 0) {
        const imageKey = (existingResult.rows[0] as any).image_key;
        const imageUrl = await getSignedCosUrl(imageKey);
        return NextResponse.json({
          success: true,
          imageKey,
          imageUrl,
          message: '使用已有图片',
        });
      }
    }

    // 生成美化版 SVG
    // 优先使用本地存储的 SDF 数据，避免重复从 PubChem 获取
    const svgResult = await generateChemicalSVG({ 
      name: name || cas,
      cas: cas,
      sdf: structureSdf || undefined,  // 传入本地 SDF 数据
    });

    if (!svgResult.success || !svgResult.svg) {
      return NextResponse.json({
        success: false,
        error: 'SVG 生成失败',
        details: svgResult.error,
      }, { status: 500 });
    }

    if (!validateSVG(svgResult.svg)) {
      return NextResponse.json({
        success: false,
        error: '生成的 SVG 无效',
      }, { status: 500 });
    }

    // 上传到腾讯云 COS
    const imageKey = `chemical-svg/${cas.replace(/-/g, '_')}_${Date.now()}.svg`;
    await uploadToCos(imageKey, Buffer.from(svgResult.svg, 'utf-8'), 'image/svg+xml');

    // 生成签名 URL
    const signedUrl = await getSignedCosUrl(imageKey);

    // 更新产品图片
    if (productId) {
      await db.execute(sql`
        UPDATE agent_products 
        SET image_key = ${imageKey}, updated_at = NOW()
        WHERE id = ${productId}
      `);
    } else if (spuId) {
      await db.execute(sql`
        UPDATE products 
        SET product_image_key = ${imageKey}, 
            product_image_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = ${spuId}
      `);
    }

    return NextResponse.json({
      success: true,
      imageKey,
      imageUrl: signedUrl,
      formula: svgResult.formula,
      isNew: true,
      message: 'SVG 生成成功',
    });
  } catch (error: any) {
    console.error('Generate product image error:', error);
    return NextResponse.json({
      success: false,
      error: '生成图片失败',
      details: error.message,
    }, { status: 500 });
  }
});
