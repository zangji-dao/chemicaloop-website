import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { generateChemicalSVG, validateSVG } from '@/services/chemical-svg-generator';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

/**
 * 生成产品图片 API
 * POST /api/admin/products/generate-image
 * 
 * Body: 
 *   - productId: string (SKU ID - agent_products)
 *   - 或 spuId: string (SPU ID - products)
 *   - 或 cas: string, name: string
 *   - force: boolean (强制重新生成，忽略缓存)
 * 
 * 生成美化版化学结构 SVG 图
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const body = await request.json();
    const { productId, spuId, cas: inputCas, name: inputName, force } = body;

    let cas = inputCas;
    let name = inputName;
    let isSpu = false;

    const db = await getDb(schema);

    // 如果提供了 productId (SKU)，获取产品信息
    if (productId) {
      const productResult = await db.execute(sql`
        SELECT ap.cas, ap.name, p.pubchem_cid
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
    }
    
    // 如果提供了 spuId (SPU)，获取产品信息
    if (spuId) {
      isSpu = true;
      const spuResult = await db.execute(sql`
        SELECT cas, name, pubchem_cid, product_image_key, structure_image_key, structure_2d_svg
        FROM products
        WHERE id = ${spuId}
      `);
      
      if (spuResult.rows.length === 0) {
        return NextResponse.json({ error: 'SPU不存在' }, { status: 404 });
      }
      
      const spu = spuResult.rows[0] as any;
      cas = spu.cas;
      name = spu.name;
      
      // 检查是否已有产品图（除非强制重新生成）
      if (spu.product_image_key && !force) {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        const imageUrl = await storage.generatePresignedUrl({
          key: spu.product_image_key,
          expireTime: 86400,
        });

        return NextResponse.json({
          success: true,
          imageKey: spu.product_image_key,
          imageUrl,
          message: '使用已有图片',
        });
      }
      
      // 如果没有产品图但有本地存储的 SVG 数据，上传并返回
      if (spu.structure_2d_svg && !force) {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        // 将 SVG 上传到对象存储
        const fileName = `chemical-svg/${cas.replace(/-/g, '_')}_pubchem_${Date.now()}.svg`;
        const imageKey = await storage.uploadFile({
          fileContent: Buffer.from(spu.structure_2d_svg, 'utf-8'),
          fileName,
          contentType: 'image/svg+xml',
        });

        const imageUrl = await storage.generatePresignedUrl({
          key: imageKey,
          expireTime: 86400,
        });

        // 更新 product_image_key
        await db.execute(sql`
          UPDATE products 
          SET product_image_key = ${imageKey}, 
              product_image_generated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${spuId}
        `);

        return NextResponse.json({
          success: true,
          imageKey,
          imageUrl,
          message: '使用本地存储的结构图',
        });
      }
      
      // 如果有 PubChem PNG 结构图，直接使用它
      if (spu.structure_image_key && !force) {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        const imageUrl = await storage.generatePresignedUrl({
          key: spu.structure_image_key,
          expireTime: 86400,
        });

        return NextResponse.json({
          success: true,
          imageKey: spu.structure_image_key,
          imageUrl,
          message: '使用 PubChem 结构图',
        });
      }
    }

    if (!cas) {
      return NextResponse.json({ error: 'CAS 码不能为空' }, { status: 400 });
    }

    // 检查是否已有图片（除非强制重新生成）
    if (productId && !force) {
      const existingResult = await db.execute(sql`
        SELECT image_key FROM agent_products WHERE id = ${productId} AND image_key IS NOT NULL
      `);
      
      if (existingResult.rows.length > 0) {
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        const imageKey = (existingResult.rows[0] as any).image_key;
        const imageUrl = await storage.generatePresignedUrl({
          key: imageKey,
          expireTime: 86400,
        });

        return NextResponse.json({
          success: true,
          imageKey,
          imageUrl,
          message: '使用已有图片',
        });
      }
    }

    // 生成美化版 SVG
    // 优先使用 CAS 查询 PubChem，因为中文名称可能查不到
    const identifier = cas || name || 'Unknown';
    const svgResult = await generateChemicalSVG({ 
      name: identifier,  // 用 CAS 或名称作为标识符
      cas: cas 
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

    // 上传到对象存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    const fileName = `chemical-svg/${cas.replace(/-/g, '_')}_${Date.now()}.svg`;
    
    const imageKey = await storage.uploadFile({
      fileContent: Buffer.from(svgResult.svg, 'utf-8'),
      fileName,
      contentType: 'image/svg+xml',
    });

    // 生成签名 URL
    const signedUrl = await storage.generatePresignedUrl({
      key: imageKey,
      expireTime: 86400,
    });

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
}
