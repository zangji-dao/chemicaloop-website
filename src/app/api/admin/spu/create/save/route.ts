import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * POST /api/admin/spu/create/save
 * 保存或更新 SPU 产品数据
 * 
 * 参数：
 * - id: string (可选) - 产品ID，如果提供则更新现有产品
 * - cas: string - CAS号（必填）
 * - name: string - 产品名称（必填）
 * - status: 'DRAFT' | 'ACTIVE' - 产品状态
 * - 其他产品字段...
 * - translations: 翻译数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      id,
      cas,
      name,
      nameEn,
      formula,
      description,
      molecularWeight,
      exactMass,
      smiles,
      smilesCanonical,
      smilesIsomeric,
      inchi,
      inchiKey,
      xlogp,
      tpsa,
      complexity,
      hBondDonorCount,
      hBondAcceptorCount,
      rotatableBondCount,
      heavyAtomCount,
      formalCharge,
      physicalDescription,
      colorForm,
      odor,
      boilingPoint,
      meltingPoint,
      flashPoint,
      density,
      solubility,
      vaporPressure,
      refractiveIndex,
      hazardClasses,
      healthHazards,
      ghsClassification,
      toxicitySummary,
      carcinogenicity,
      firstAid,
      storageConditions,
      incompatibleMaterials,
      hsCode,
      hsCodeExtensions,
      status = 'ACTIVE',
      synonyms,
      applications,
      translations,
      pubchemCid,
      structureSdf,
      structureImageKey,
      structure2dSvg,
      structureUrl,
      productImageKey,
    } = body;

    // 验证必填字段
    if (!cas) {
      return NextResponse.json({
        success: false,
        error: 'CAS number is required',
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required',
      }, { status: 400 });
    }

    const db = await getDb(schema);

    // 如果提供了ID，更新现有产品
    if (id) {
      // 检查产品是否存在
      const existingProduct = await db.execute(sql`
        SELECT id FROM products WHERE id = ${id}
      `);

      if (existingProduct.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Product not found',
        }, { status: 404 });
      }

      // 更新产品
      await db.update(schema.products)
        .set({
          name,
          nameEn: nameEn || null,
          formula: formula || null,
          description: description || null,
          molecularWeight: molecularWeight || null,
          exactMass: exactMass || null,
          smiles: smiles || null,
          smilesCanonical: smilesCanonical || null,
          smilesIsomeric: smilesIsomeric || null,
          inchi: inchi || null,
          inchiKey: inchiKey || null,
          xlogp: xlogp || null,
          tpsa: tpsa || null,
          complexity: complexity ? parseInt(complexity) : null,
          hBondDonorCount: hBondDonorCount ? parseInt(hBondDonorCount) : null,
          hBondAcceptorCount: hBondAcceptorCount ? parseInt(hBondAcceptorCount) : null,
          rotatableBondCount: rotatableBondCount ? parseInt(rotatableBondCount) : null,
          heavyAtomCount: heavyAtomCount ? parseInt(heavyAtomCount) : null,
          formalCharge: formalCharge ? parseInt(formalCharge) : null,
          physicalDescription: physicalDescription || null,
          colorForm: colorForm || null,
          odor: odor || null,
          boilingPoint: boilingPoint || null,
          meltingPoint: meltingPoint || null,
          flashPoint: flashPoint || null,
          density: density || null,
          solubility: solubility || null,
          vaporPressure: vaporPressure || null,
          refractiveIndex: refractiveIndex || null,
          hazardClasses: hazardClasses || null,
          healthHazards: healthHazards || null,
          ghsClassification: ghsClassification || null,
          toxicitySummary: toxicitySummary || null,
          carcinogenicity: carcinogenicity || null,
          firstAid: firstAid || null,
          storageConditions: storageConditions || null,
          incompatibleMaterials: incompatibleMaterials || null,
          hsCode: hsCode || null,
          hsCodeExtensions: hsCodeExtensions || null,
          status,
          synonyms: synonyms && synonyms.length > 0 ? synonyms : null,
          applications: applications && applications.length > 0 ? applications : null,
          translations: translations || null,
          pubchemCid: pubchemCid || null,
          structureSdf: structureSdf || null,
          structureImageKey: structureImageKey || null,
          structure2dSvg: structure2dSvg || null,
          productImageKey: productImageKey || null,
          updatedAt: sql`NOW()`,
        })
        .where(eq(schema.products.id, id));

      // 返回更新后的产品
      const updatedProduct = await db.execute(sql`
        SELECT * FROM products WHERE id = ${id}
      `);

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct.rows[0],
      });
    }

    // 没有提供ID，检查是否已存在相同CAS的产品
    const existingProduct = await db.execute(sql`
      SELECT id, status FROM products WHERE cas = ${cas}
    `);

    if (existingProduct.rows.length > 0) {
      // 产品已存在，更新它
      const productId = (existingProduct.rows[0] as any).id;
      
      await db.update(schema.products)
        .set({
          name,
          nameEn: nameEn || null,
          formula: formula || null,
          description: description || null,
          molecularWeight: molecularWeight || null,
          exactMass: exactMass || null,
          smiles: smiles || null,
          smilesCanonical: smilesCanonical || null,
          smilesIsomeric: smilesIsomeric || null,
          inchi: inchi || null,
          inchiKey: inchiKey || null,
          xlogp: xlogp || null,
          tpsa: tpsa || null,
          complexity: complexity ? parseInt(complexity) : null,
          hBondDonorCount: hBondDonorCount ? parseInt(hBondDonorCount) : null,
          hBondAcceptorCount: hBondAcceptorCount ? parseInt(hBondAcceptorCount) : null,
          rotatableBondCount: rotatableBondCount ? parseInt(rotatableBondCount) : null,
          heavyAtomCount: heavyAtomCount ? parseInt(heavyAtomCount) : null,
          formalCharge: formalCharge ? parseInt(formalCharge) : null,
          physicalDescription: physicalDescription || null,
          colorForm: colorForm || null,
          odor: odor || null,
          boilingPoint: boilingPoint || null,
          meltingPoint: meltingPoint || null,
          flashPoint: flashPoint || null,
          density: density || null,
          solubility: solubility || null,
          vaporPressure: vaporPressure || null,
          refractiveIndex: refractiveIndex || null,
          hazardClasses: hazardClasses || null,
          healthHazards: healthHazards || null,
          ghsClassification: ghsClassification || null,
          toxicitySummary: toxicitySummary || null,
          carcinogenicity: carcinogenicity || null,
          firstAid: firstAid || null,
          storageConditions: storageConditions || null,
          incompatibleMaterials: incompatibleMaterials || null,
          hsCode: hsCode || null,
          hsCodeExtensions: hsCodeExtensions || null,
          status,
          synonyms: synonyms && synonyms.length > 0 ? synonyms : null,
          applications: applications && applications.length > 0 ? applications : null,
          translations: translations || null,
          pubchemCid: pubchemCid || null,
          structureSdf: structureSdf || null,
          structureImageKey: structureImageKey || null,
          structure2dSvg: structure2dSvg || null,
          productImageKey: productImageKey || null,
          updatedAt: sql`NOW()`,
        })
        .where(eq(schema.products.id, productId));

      // 返回更新后的产品
      const updatedProduct = await db.execute(sql`
        SELECT * FROM products WHERE id = ${productId}
      `);

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct.rows[0],
      });
    }

    // 产品不存在，创建新产品
    const insertResult = await db.execute(sql`
      INSERT INTO products (
        cas, name, name_en, formula, description,
        status,
        molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
        inchi, inchi_key, xlogp, tpsa, complexity,
        h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
        heavy_atom_count, formal_charge,
        physical_description, color_form, odor,
        boiling_point, melting_point, flash_point, density, solubility,
        vapor_pressure, refractive_index,
        hazard_classes, health_hazards, ghs_classification,
        toxicity_summary, carcinogenicity, first_aid,
        storage_conditions, incompatible_materials,
        hs_code, hs_code_extensions,
        synonyms, applications, translations,
        pubchem_cid,
        structure_url, structure_sdf, structure_image_key, structure_2d_svg,
        product_image_key,
        created_at, updated_at
      ) VALUES (
        ${cas},
        ${name},
        ${nameEn || null},
        ${formula || null},
        ${description || null},
        ${status},
        ${molecularWeight || null},
        ${exactMass || null},
        ${smiles || null},
        ${smilesCanonical || null},
        ${smilesIsomeric || null},
        ${inchi || null},
        ${inchiKey || null},
        ${xlogp || null},
        ${tpsa || null},
        ${complexity ? parseInt(complexity) : null},
        ${hBondDonorCount ? parseInt(hBondDonorCount) : null},
        ${hBondAcceptorCount ? parseInt(hBondAcceptorCount) : null},
        ${rotatableBondCount ? parseInt(rotatableBondCount) : null},
        ${heavyAtomCount ? parseInt(heavyAtomCount) : null},
        ${formalCharge ? parseInt(formalCharge) : null},
        ${physicalDescription || null},
        ${colorForm || null},
        ${odor || null},
        ${boilingPoint || null},
        ${meltingPoint || null},
        ${flashPoint || null},
        ${density || null},
        ${solubility || null},
        ${vaporPressure || null},
        ${refractiveIndex || null},
        ${hazardClasses || null},
        ${healthHazards || null},
        ${ghsClassification || null},
        ${toxicitySummary || null},
        ${carcinogenicity || null},
        ${firstAid || null},
        ${storageConditions || null},
        ${incompatibleMaterials || null},
        ${hsCode || null},
        ${hsCodeExtensions ? JSON.stringify(hsCodeExtensions) : null},
        ${synonyms && synonyms.length > 0 ? JSON.stringify(synonyms) : null},
        ${applications && applications.length > 0 ? JSON.stringify(applications) : null},
        ${translations ? JSON.stringify(translations) : null},
        ${pubchemCid || null},
        ${structureUrl || null},
        ${structureSdf || null},
        ${structureImageKey || null},
        ${structure2dSvg || null},
        ${productImageKey || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: insertResult.rows[0],
      isNew: true,
    });
  } catch (error: any) {
    console.error('[SPU Save] Error:', error);
    
    // 处理唯一约束冲突（CAS号已存在）
    if (error?.code === '23505' && error?.constraint === 'products_cas_key') {
      return NextResponse.json({
        success: false,
        error: 'Product with this CAS number already exists',
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to save product',
    }, { status: 500 });
  }
}
