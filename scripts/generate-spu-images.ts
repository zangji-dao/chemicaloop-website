/**
 * 批量为缺少产品图的 SPU 生成图片
 * 运行方式: npx tsx scripts/generate-spu-images.ts
 */

import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../src/storage/database/shared/schema';
import { generateChemicalSVG, validateSVG } from '../src/lib/chemical-svg-generator';

async function main() {
  console.log('开始为缺少产品图的 SPU 生成图片...\n');
  
  const db = await getDb(schema);
  
  // 查找缺少产品图的 SPU
  const result = await db.execute(sql`
    SELECT id, cas, name 
    FROM products 
    WHERE product_image_key IS NULL 
    ORDER BY created_at DESC
  `);
  
  console.log(`找到 ${result.rows.length} 个需要生成产品图的 SPU\n`);
  
  if (result.rows.length === 0) {
    console.log('所有 SPU 都已有产品图');
    return;
  }
  
  // 初始化对象存储
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
  
  let successCount = 0;
  let failCount = 0;
  
  for (const row of result.rows) {
    const spu = row as any;
    console.log(`处理 [${spu.cas}] ${spu.name}...`);
    
    try {
      // 生成 SVG
      const svgResult = await generateChemicalSVG({ 
        name: spu.name || 'Unknown', 
        cas: spu.cas 
      });
      
      if (!svgResult.success || !svgResult.svg || !validateSVG(svgResult.svg)) {
        console.log(`  ❌ SVG 生成失败: ${svgResult.error || '无效 SVG'}`);
        failCount++;
        continue;
      }
      
      // 上传到对象存储
      const fileName = `chemical-svg/${spu.cas.replace(/-/g, '_')}_${Date.now()}.svg`;
      const imageKey = await storage.uploadFile({
        fileContent: Buffer.from(svgResult.svg, 'utf-8'),
        fileName,
        contentType: 'image/svg+xml',
      });
      
      // 更新数据库
      await db.execute(sql`
        UPDATE products 
        SET product_image_key = ${imageKey}, 
            product_image_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = ${spu.id}
      `);
      
      console.log(`  ✅ 成功: ${imageKey}`);
      successCount++;
      
      // 稍微等待一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.log(`  ❌ 错误: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n完成！成功: ${successCount}, 失败: ${failCount}`);
}

main().catch(console.error);
