/**
 * 批量生成产品图片脚本
 * 使用美化版 SVG 生成化学结构图
 */

import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import * as schema from '../src/storage/database/shared/schema';
import { sql } from 'drizzle-orm';
import { generateChemicalSVG } from '../src/lib/chemical-svg-generator';

async function main() {
  console.log('🎨 批量生成美化版产品图片\n');

  const db = await getDb(schema);

  // 获取所有已上架的 SPU
  const spuResult = await db.execute(sql`
    SELECT DISTINCT
      spu.id,
      spu.cas,
      spu.name,
      spu.name_en
    FROM products spu
    WHERE EXISTS (
      SELECT 1 FROM agent_products sku 
      WHERE sku.spu_id = spu.id AND sku.status = 'active'
    )
    ORDER BY spu.cas
  `);

  console.log(`📋 找到 ${spuResult.rows.length} 个已上架 SPU\n`);

  if (spuResult.rows.length === 0) {
    console.log('没有需要处理的 SPU');
    return;
  }

  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  let successCount = 0;
  let failCount = 0;

  for (const row of spuResult.rows) {
    const spu = row as any;
    const displayName = spu.name_en || spu.name;
    console.log(`\n处理 [${spu.cas}] ${displayName}`);

    try {
      // 生成美化版 SVG
      const result = await generateChemicalSVG({ 
        name: displayName, 
        cas: spu.cas 
      });

      if (!result.success || !result.svg) {
        console.log(`  ❌ SVG 生成失败: ${result.error}`);
        failCount++;
        continue;
      }

      // 上传到对象存储
      const fileName = `chemical-svg/${spu.cas.replace(/-/g, '_')}_${Date.now()}.svg`;
      const svgBuffer = Buffer.from(result.svg, 'utf-8');
      
      const imageKey = await storage.uploadFile({
        fileContent: svgBuffer,
        fileName,
        contentType: 'image/svg+xml',
      });

      // 更新所有 active 的 SKU
      await db.execute(sql`
        UPDATE agent_products 
        SET image_key = ${imageKey}, updated_at = NOW()
        WHERE spu_id = ${spu.id} AND status = 'active'
      `);

      console.log(`  ✅ 成功！formula: ${result.formula}`);
      successCount++;

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.log(`  ❌ 错误: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n\n📊 处理完成！`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
}

main().catch(console.error);
