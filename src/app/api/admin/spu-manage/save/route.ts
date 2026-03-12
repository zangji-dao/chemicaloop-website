import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { generateChemicalSVG, validateSVG } from '@/lib/chemical-svg-generator';

/**
 * POST /api/spu/save
 * 保存或更新 SPU 数据
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const {
      cas,
      name,
      nameEn,
      formula,
      description,
      pubchemCid,
      molecularWeight,
      smiles,
      inchi,
      inchiKey,
      xlogp,
      boilingPoint,
      meltingPoint,
      flashPoint,
      hazardClasses,
      synonyms,
      applications,
      imageUrl,
      structureUrl, // PubChem 2D 结构图 URL
      hsCode,
      translations,
      physicalDescription,
      colorForm,
      odor,
      density,
      solubility,
      vaporPressure,
      status, // 接受状态参数
    } = body;

    // 验证必填字段
    if (!cas || !name) {
      return NextResponse.json(
        { success: false, error: 'CAS and name are required' },
        { status: 400 }
      );
    }

    // 检查是否已存在该 CAS 的 SPU
    const existingResult = await db.execute(sql`
      SELECT id FROM products WHERE cas = ${cas}
    `);

    if (existingResult.rows.length > 0) {
      // 更新现有 SPU
      const spuId = (existingResult.rows[0] as any).id;
      
      await db.execute(sql`
        UPDATE products SET
          name = COALESCE(${name}, name),
          name_en = COALESCE(${nameEn || null}, name_en),
          formula = COALESCE(${formula || null}, formula),
          description = COALESCE(${description || null}, description),
          pubchem_cid = COALESCE(${pubchemCid || null}, pubchem_cid),
          molecular_weight = COALESCE(${molecularWeight || null}, molecular_weight),
          smiles = COALESCE(${smiles || null}, smiles),
          inchi = COALESCE(${inchi || null}, inchi),
          inchi_key = COALESCE(${inchiKey || null}, inchi_key),
          xlogp = COALESCE(${xlogp || null}, xlogp),
          boiling_point = COALESCE(${boilingPoint || null}, boiling_point),
          melting_point = COALESCE(${meltingPoint || null}, melting_point),
          flash_point = COALESCE(${flashPoint || null}, flash_point),
          hazard_classes = COALESCE(${hazardClasses || null}, hazard_classes),
          synonyms = COALESCE(${synonyms ? JSON.stringify(synonyms) : null}::jsonb, synonyms),
          applications = COALESCE(${applications && applications.length > 0 ? JSON.stringify(applications) : null}::jsonb, applications),
          image_url = COALESCE(${imageUrl || null}, image_url),
          structure_url = COALESCE(${structureUrl || null}, structure_url),
          hs_code = COALESCE(${hsCode || null}, hs_code),
          translations = COALESCE(${translations ? JSON.stringify(translations) : null}::jsonb, translations),
          pubchem_synced_at = NOW(),
          updated_at = NOW()
        WHERE id = ${spuId}
      `);

      return NextResponse.json({
        success: true,
        data: { id: spuId, cas, name, updated: true },
        message: 'SPU updated successfully',
      });
    } else {
      // 创建新 SPU
      const insertResult = await db.execute(sql`
        INSERT INTO products (
          cas, name, name_en, formula, description,
          pubchem_cid, molecular_weight, smiles, inchi, inchi_key, xlogp,
          boiling_point, melting_point, flash_point, hazard_classes,
          synonyms, applications, image_url, structure_url, hs_code, translations,
          status, pubchem_synced_at, created_at, updated_at
        ) VALUES (
          ${cas}, ${name}, ${nameEn || null}, ${formula || null}, ${description || null},
          ${pubchemCid || null}, ${molecularWeight || null}, ${smiles || null},
          ${inchi || null}, ${inchiKey || null}, ${xlogp || null},
          ${boilingPoint || null}, ${meltingPoint || null}, ${flashPoint || null},
          ${hazardClasses || null},
          ${synonyms ? JSON.stringify(synonyms) : null}::jsonb,
          ${applications && applications.length > 0 ? JSON.stringify(applications) : null}::jsonb,
          ${imageUrl || null}, ${structureUrl || null}, ${hsCode || null},
          ${translations ? JSON.stringify(translations) : null}::jsonb,
          ${status || 'INACTIVE'}, NOW(), NOW(), NOW()
        )
        RETURNING id
      `);

      const newSpuId = (insertResult.rows[0] as any).id;

      // 异步生成产品图（直接调用，不走 HTTP）
      (async () => {
        try {
          // 生成美化版 SVG
          const svgResult = await generateChemicalSVG({ name: name || 'Unknown', cas });

          if (svgResult.success && svgResult.svg && validateSVG(svgResult.svg)) {
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

            // 更新产品图片
            await db.execute(sql`
              UPDATE products 
              SET product_image_key = ${imageKey}, 
                  product_image_generated_at = NOW(),
                  updated_at = NOW()
              WHERE id = ${newSpuId}
            `);

            console.log(`[SPU] Generated product image for ${cas}: ${imageKey}`);
          } else {
            console.error(`[SPU] Failed to generate SVG for ${cas}:`, svgResult.error);
          }
        } catch (err) {
          console.error(`[SPU] Error generating product image for ${cas}:`, err);
        }
      })();

      return NextResponse.json({
        success: true,
        data: { id: newSpuId, cas, name, created: true },
        message: 'SPU created successfully',
      });
    }
  } catch (error) {
    console.error('Error saving SPU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save SPU' },
      { status: 500 }
    );
  }
}
