import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { generateChemicalSVG, validateSVG } from '@/services/chemical-svg-generator';
import { withAdminAuth } from '@/lib/withAuth';
import { COS_CONFIG, COS_CREDENTIALS, isSandbox } from '@/lib/env';

/**
 * 对象存储客户端
 * 
 * 沙箱环境：使用 coze-coding-dev-sdk 的 S3Storage（封装了沙箱代理服务）
 * 生产环境：使用腾讯云 COS（也通过 S3Storage 配置）
 */
const createStorage = (): S3Storage | null => {
  if (isSandbox) {
    // 沙箱环境：使用系统对象存储（通过环境变量自动配置）
    return new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      bucketName: process.env.COZE_BUCKET_NAME,
      accessKey: '',
      secretKey: '',
      region: 'cn-beijing',
    });
  } else if (COS_CREDENTIALS.accessKeyId) {
    // 生产环境：使用腾讯云 COS
    return new S3Storage({
      endpointUrl: `https://cos.${COS_CONFIG.region}.myqcloud.com`,
      bucketName: COS_CONFIG.bucket,
      accessKey: COS_CREDENTIALS.accessKeyId,
      secretKey: COS_CREDENTIALS.secretAccessKey,
      region: COS_CONFIG.region,
    });
  }
  return null;
};

const storage = createStorage();

/**
 * 上传文件到对象存储
 * 
 * 注意：S3Storage.uploadFile 返回的 key 与传入的 fileName 不同（SDK 会添加 UUID 前缀）
 * 必须使用返回的 key 进行后续操作
 */
async function uploadToStorage(fileName: string, content: Buffer, contentType: string): Promise<string> {
  if (!storage) {
    throw new Error('Storage not configured');
  }
  
  // 使用 S3Storage.uploadFile，返回的是实际的 key（包含 UUID 前缀）
  const actualKey = await storage.uploadFile({
    fileContent: content,
    fileName: fileName,
    contentType: contentType,
  });
  
  return actualKey;
}

/**
 * 生成签名 URL
 * 使用 S3Storage.generatePresignedUrl 方法
 */
async function getSignedStorageUrl(key: string, expireTime: number = 86400): Promise<string> {
  if (!storage) {
    throw new Error('Storage not configured');
  }
  
  return storage.generatePresignedUrl({
    key: key,
    expireTime: expireTime,
  });
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
        const imageUrl = await getSignedStorageUrl(spu.product_image_key);
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
        const imageUrl = await getSignedStorageUrl(imageKey);
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

    // 上传到对象存储
    // 注意：uploadToStorage 返回的是实际的 key（包含 UUID 前缀），而非传入的 fileName
    const suggestedFileName = `chemical-svg/${cas.replace(/-/g, '_')}_${Date.now()}.svg`;
    const actualImageKey = await uploadToStorage(suggestedFileName, Buffer.from(svgResult.svg, 'utf-8'), 'image/svg+xml');

    // 生成签名 URL
    const signedUrl = await getSignedStorageUrl(actualImageKey);

    // 更新产品图片
    if (productId) {
      await db.execute(sql`
        UPDATE agent_products 
        SET image_key = ${actualImageKey}, updated_at = NOW()
        WHERE id = ${productId}
      `);
    } else if (spuId) {
      await db.execute(sql`
        UPDATE products 
        SET product_image_key = ${actualImageKey}, 
            product_image_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = ${spuId}
      `);
    }

    return NextResponse.json({
      success: true,
      imageKey: actualImageKey,
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
