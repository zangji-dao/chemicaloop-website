/**
 * PubChem 数据同步 API
 * POST /api/admin/spu/create/sync-pubchem
 * 
 * 功能：
 * - 预览模式：获取单个 CAS 的 PubChem 数据（不写入数据库）
 * - 单个同步：更新或创建单个产品的 PubChem 数据
 * - 批量同步：批量更新多个产品的 PubChem 数据
 * - GET：获取同步统计信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@/db';

import { PubChemData } from '@/services/pubchem/types';
import { fetchPubChemData } from '@/services/pubchem/api';
import { getCachedPreview, setCachedPreview } from '@/services/pubchem/cache';
import { extractChineseName, safeString, safeNumber } from '@/services/pubchem/utils';

/**
 * POST /api/admin/spu/create/sync-pubchem
 * 
 * 参数：
 * - preview: boolean - 预览模式，只获取数据不写入数据库
 * - cas: string - 单个 CAS 号
 * - forceUpdate: boolean - 强制更新已有数据的 SPU
 * - limit: number - 批量模式下限制数量
 * - casList: string[] - 批量模式下指定 CAS 列表
 * - createIfNotExist: boolean - 产品不存在时是否创建
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const { 
      preview = false,
      cas,
      forceUpdate = false,
      limit = 10,
      casList = null,
      createIfNotExist = false,
    } = body;
    
    // ========== 预览模式：只获取数据，不写入数据库 ==========
    if (preview && cas) {
      const trimmedCas = cas.trim();
      console.log(`[Sync-PubChem] Preview mode for CAS: ${trimmedCas}`);
      
      // 检查缓存
      const cachedData = getCachedPreview(trimmedCas);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          data: cachedData,
        });
      }
      
      const pubchemData = await fetchPubChemData(trimmedCas);
      
      if (!pubchemData) {
        return NextResponse.json({
          success: false,
          error: 'PUBCHEM_NOT_FOUND',
          message: 'This CAS number does not exist in PubChem',
        });
      }
      
      // 提取中文名称
      const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
      
      // 构建返回数据
      const responseData = buildPreviewResponse(pubchemData, nameZh);
      
      // 缓存结果
      setCachedPreview(trimmedCas, responseData);
      
      return NextResponse.json({
        success: true,
        source: 'pubchem',
        data: responseData,
      });
    }
    
    // ========== 单个CAS同步模式 ==========
    if (cas && !preview && !casList) {
      return handleSingleSync(cas, createIfNotExist);
    }
    
    // ========== 批量同步模式 ==========
    if (casList && Array.isArray(casList)) {
      return handleBatchSync(casList);
    }
    
    // ========== 默认批量同步：同步所有需要更新的 SPU ==========
    return handleDefaultSync(forceUpdate, limit);
    
  } catch (error: any) {
    console.error('Error syncing PubChem data:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sync PubChem data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/spu/create/sync-pubchem
 * 获取 SPU 同步状态统计
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_spu,
        COUNT(pubchem_cid) as with_pubchem,
        COUNT(*) - COUNT(pubchem_cid) as need_sync,
        COUNT(physical_description) as with_physical_desc,
        COUNT(hazard_classes) as with_hazard,
        COUNT(ghs_classification) as with_ghs,
        COUNT(first_aid) as with_first_aid
      FROM products
    `);
    
    const stats = statsResult.rows[0] as any;
    
    return NextResponse.json({
      success: true,
      data: {
        totalSpu: parseInt(stats.total_spu || '0'),
        withPubchem: parseInt(stats.with_pubchem || '0'),
        needSync: parseInt(stats.need_sync || '0'),
        withPhysicalDesc: parseInt(stats.with_physical_desc || '0'),
        withHazard: parseInt(stats.with_hazard || '0'),
        withGhs: parseInt(stats.with_ghs || '0'),
        withFirstAid: parseInt(stats.with_first_aid || '0'),
      },
    });
    
  } catch (error: any) {
    console.error('Error getting sync stats:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get sync stats' },
      { status: 500 }
    );
  }
}

// ========== 辅助函数 ==========

/**
 * 构建预览响应数据
 */
function buildPreviewResponse(pubchemData: PubChemData, nameZh: string | null) {
  return {
    pubchemCid: pubchemData.cid,
    pubchemSyncedAt: new Date().toISOString(),
    nameZh,
    nameEn: pubchemData.synonyms?.[0] || null,
    formula: pubchemData.formula,
    molecularWeight: pubchemData.molecularWeight,
    exactMass: pubchemData.exactMass,
    smiles: pubchemData.smiles,
    smilesCanonical: pubchemData.smilesCanonical,
    smilesIsomeric: pubchemData.smilesIsomeric,
    inchi: pubchemData.inchi,
    inchiKey: pubchemData.inchiKey,
    xlogp: pubchemData.xlogp,
    tpsa: pubchemData.tpsa,
    complexity: pubchemData.complexity,
    hBondDonorCount: pubchemData.hBondDonorCount,
    hBondAcceptorCount: pubchemData.hBondAcceptorCount,
    rotatableBondCount: pubchemData.rotatableBondCount,
    heavyAtomCount: pubchemData.heavyAtomCount,
    formalCharge: pubchemData.formalCharge,
    description: pubchemData.description,
    physicalDescription: pubchemData.physicalDescription,
    colorForm: pubchemData.colorForm,
    odor: pubchemData.odor,
    boilingPoint: pubchemData.boilingPoint,
    meltingPoint: pubchemData.meltingPoint,
    flashPoint: pubchemData.flashPoint,
    density: pubchemData.density,
    solubility: pubchemData.solubility,
    vaporPressure: pubchemData.vaporPressure,
    refractiveIndex: pubchemData.refractiveIndex,
    hazardClasses: pubchemData.hazardClasses,
    healthHazards: pubchemData.healthHazards,
    ghsClassification: pubchemData.ghsClassification,
    toxicitySummary: pubchemData.toxicitySummary,
    carcinogenicity: pubchemData.carcinogenicity,
    firstAid: pubchemData.firstAid,
    storageConditions: pubchemData.storageConditions,
    incompatibleMaterials: pubchemData.incompatibleMaterials,
    synonyms: pubchemData.synonyms,
    applications: pubchemData.applications,
    structureUrl: pubchemData.structureUrl,
    structureImageKey: pubchemData.structureImageKey,
    structureSdf: pubchemData.structureSdf,
    structure2dSvg: pubchemData.structure2dSvg,
  };
}

/**
 * 处理单个 CAS 同步
 */
async function handleSingleSync(cas: string, createIfNotExist: boolean) {
  const trimmedCas = cas.trim();
  console.log(`[Sync-PubChem] Single CAS sync mode for: ${trimmedCas}`);
  
  const db = await getDb(schema);
  
  // 从 PubChem 获取数据
  const pubchemData = await fetchPubChemData(trimmedCas);
  
  if (!pubchemData) {
    return NextResponse.json({
      success: false,
      error: 'PUBCHEM_NOT_FOUND',
      message: 'This CAS number does not exist in PubChem',
    });
  }
  
  // 查询产品是否存在
  const existingProduct = await db.execute(sql`
    SELECT id, cas, name, status FROM products WHERE cas = ${trimmedCas}
  `);
  
  if (existingProduct.rows.length === 0) {
    // 产品不存在
    if (createIfNotExist) {
      return createNewProduct(db, trimmedCas, pubchemData);
    } else {
      return NextResponse.json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found. Use createIfNotExist=true to create a new product.',
        pubchemData: buildPreviewResponse(pubchemData, 
          pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null),
      });
    }
  }
  
  // 更新现有产品
  const product = existingProduct.rows[0] as any;
  return updateProduct(db, product.id, pubchemData);
}

/**
 * 创建新产品
 */
async function createNewProduct(db: any, cas: string, pubchemData: PubChemData) {
  console.log(`[Sync-PubChem] Creating new product for CAS: ${cas}`);
  
  const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
  
  const insertResult = await db.execute(sql`
    INSERT INTO products (
      cas, name, name_en, formula, description,
      pubchem_cid, pubchem_data_source, status,
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
      structure_url, structure_image_key, structure_sdf, structure_2d_svg,
      synonyms, applications,
      pubchem_synced_at, created_at, updated_at
    ) VALUES (
      ${cas},
      ${nameZh || pubchemData.synonyms?.[0] || cas},
      ${pubchemData.synonyms?.[0] || null},
      ${safeString(pubchemData.formula)},
      ${safeString(pubchemData.description)},
      ${pubchemData.cid || null},
      'pubchem',
      'DRAFT',
      ${safeString(pubchemData.molecularWeight)},
      ${safeString(pubchemData.exactMass)},
      ${safeString(pubchemData.smiles)},
      ${safeString(pubchemData.smilesCanonical)},
      ${safeString(pubchemData.smilesIsomeric)},
      ${safeString(pubchemData.inchi)},
      ${safeString(pubchemData.inchiKey)},
      ${safeString(pubchemData.xlogp)},
      ${safeString(pubchemData.tpsa)},
      ${safeNumber(pubchemData.complexity)},
      ${safeNumber(pubchemData.hBondDonorCount)},
      ${safeNumber(pubchemData.hBondAcceptorCount)},
      ${safeNumber(pubchemData.rotatableBondCount)},
      ${safeNumber(pubchemData.heavyAtomCount)},
      ${safeNumber(pubchemData.formalCharge)},
      ${safeString(pubchemData.physicalDescription)},
      ${safeString(pubchemData.colorForm)},
      ${safeString(pubchemData.odor)},
      ${safeString(pubchemData.boilingPoint)},
      ${safeString(pubchemData.meltingPoint)},
      ${safeString(pubchemData.flashPoint)},
      ${safeString(pubchemData.density)},
      ${safeString(pubchemData.solubility)},
      ${safeString(pubchemData.vaporPressure)},
      ${safeString(pubchemData.refractiveIndex)},
      ${safeString(pubchemData.hazardClasses)},
      ${safeString(pubchemData.healthHazards)},
      ${safeString(pubchemData.ghsClassification)},
      ${safeString(pubchemData.toxicitySummary)},
      ${safeString(pubchemData.carcinogenicity)},
      ${safeString(pubchemData.firstAid)},
      ${safeString(pubchemData.storageConditions)},
      ${safeString(pubchemData.incompatibleMaterials)},
      ${safeString(pubchemData.structureUrl)},
      ${safeString(pubchemData.structureImageKey)},
      ${safeString(pubchemData.structureSdf)},
      ${safeString(pubchemData.structure2dSvg)},
      ${pubchemData.synonyms && pubchemData.synonyms.length > 0 ? JSON.stringify(pubchemData.synonyms) : null},
      ${pubchemData.applications && pubchemData.applications.length > 0 ? JSON.stringify(pubchemData.applications) : null},
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id
  `);
  
  const newId = (insertResult.rows[0] as any)?.id;
  
  return NextResponse.json({
    success: true,
    message: 'Product created successfully',
    action: 'created',
    id: newId,
    cid: pubchemData.cid,
    nameZh,
  });
}

/**
 * 更新现有产品
 */
async function updateProduct(db: any, productId: string, pubchemData: PubChemData) {
  await db.update(schema.products)
    .set({
      pubchemCid: pubchemData.cid || null,
      pubchemDataSource: 'pubchem',
      description: safeString(pubchemData.description),
      formula: safeString(pubchemData.formula),
      molecularWeight: safeString(pubchemData.molecularWeight),
      exactMass: safeString(pubchemData.exactMass),
      smiles: safeString(pubchemData.smiles),
      smilesCanonical: safeString(pubchemData.smilesCanonical),
      smilesIsomeric: safeString(pubchemData.smilesIsomeric),
      inchi: safeString(pubchemData.inchi),
      inchiKey: safeString(pubchemData.inchiKey),
      xlogp: safeString(pubchemData.xlogp),
      tpsa: safeString(pubchemData.tpsa),
      complexity: safeNumber(pubchemData.complexity),
      hBondDonorCount: safeNumber(pubchemData.hBondDonorCount),
      hBondAcceptorCount: safeNumber(pubchemData.hBondAcceptorCount),
      rotatableBondCount: safeNumber(pubchemData.rotatableBondCount),
      heavyAtomCount: safeNumber(pubchemData.heavyAtomCount),
      formalCharge: safeNumber(pubchemData.formalCharge),
      physicalDescription: safeString(pubchemData.physicalDescription),
      colorForm: safeString(pubchemData.colorForm),
      odor: safeString(pubchemData.odor),
      boilingPoint: safeString(pubchemData.boilingPoint),
      meltingPoint: safeString(pubchemData.meltingPoint),
      flashPoint: safeString(pubchemData.flashPoint),
      density: safeString(pubchemData.density),
      solubility: safeString(pubchemData.solubility),
      vaporPressure: safeString(pubchemData.vaporPressure),
      refractiveIndex: safeString(pubchemData.refractiveIndex),
      hazardClasses: safeString(pubchemData.hazardClasses),
      healthHazards: safeString(pubchemData.healthHazards),
      ghsClassification: safeString(pubchemData.ghsClassification),
      toxicitySummary: safeString(pubchemData.toxicitySummary),
      carcinogenicity: safeString(pubchemData.carcinogenicity),
      firstAid: safeString(pubchemData.firstAid),
      storageConditions: safeString(pubchemData.storageConditions),
      incompatibleMaterials: safeString(pubchemData.incompatibleMaterials),
      structureUrl: safeString(pubchemData.structureUrl),
      structureImageKey: safeString(pubchemData.structureImageKey),
      structureSdf: safeString(pubchemData.structureSdf),
      structure2dSvg: safeString(pubchemData.structure2dSvg),
      synonyms: pubchemData.synonyms && pubchemData.synonyms.length > 0 ? pubchemData.synonyms : null,
      applications: pubchemData.applications && pubchemData.applications.length > 0 ? pubchemData.applications : null,
      translations: sql`(
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(COALESCE(translations, '{}'::jsonb))
        WHERE key NOT IN (
          'description', 'applications', 'boilingPoint', 'meltingPoint', 'flashPoint', 'hazardClasses', 
          'healthHazards', 'ghsClassification', 'firstAid', 'storageConditions', 
          'incompatibleMaterials', 'solubility', 'vaporPressure', 'refractiveIndex',
          'physicalDescription'
        )
      )::jsonb`,
      pubchemSyncedAt: sql`NOW()`,
      updatedAt: sql`NOW()`,
    })
    .where(eq(schema.products.id, productId));
  
  return NextResponse.json({
    success: true,
    message: 'Product updated successfully',
    action: 'updated',
    id: productId,
    cid: pubchemData.cid,
  });
}

/**
 * 处理批量同步
 */
async function handleBatchSync(casList: string[]) {
  const db = await getDb(schema);
  const results = { updated: [] as any[], failed: [] as any[] };
  
  for (const cas of casList) {
    const trimmedCas = cas.trim();
    console.log(`[Sync] Processing CAS: ${trimmedCas}`);
    
    try {
      const pubchemData = await fetchPubChemData(trimmedCas);
      
      if (!pubchemData) {
        results.failed.push({ cas: trimmedCas, reason: 'PubChem data not found' });
        continue;
      }
      
      // 查询产品
      const existingProduct = await db.execute(sql`
        SELECT id, name FROM products WHERE cas = ${trimmedCas}
      `);
      
      if (existingProduct.rows.length === 0) {
        results.failed.push({ cas: trimmedCas, reason: 'Product not found' });
        continue;
      }
      
      const product = existingProduct.rows[0] as any;
      
      // 更新产品
      await db.update(schema.products)
        .set({
          pubchemCid: pubchemData.cid || null,
          pubchemDataSource: 'pubchem',
          description: safeString(pubchemData.description),
          formula: safeString(pubchemData.formula),
          molecularWeight: safeString(pubchemData.molecularWeight),
          exactMass: safeString(pubchemData.exactMass),
          smiles: safeString(pubchemData.smiles),
          smilesCanonical: safeString(pubchemData.smilesCanonical),
          smilesIsomeric: safeString(pubchemData.smilesIsomeric),
          inchi: safeString(pubchemData.inchi),
          inchiKey: safeString(pubchemData.inchiKey),
          xlogp: safeString(pubchemData.xlogp),
          tpsa: safeString(pubchemData.tpsa),
          complexity: safeNumber(pubchemData.complexity),
          hBondDonorCount: safeNumber(pubchemData.hBondDonorCount),
          hBondAcceptorCount: safeNumber(pubchemData.hBondAcceptorCount),
          rotatableBondCount: safeNumber(pubchemData.rotatableBondCount),
          heavyAtomCount: safeNumber(pubchemData.heavyAtomCount),
          formalCharge: safeNumber(pubchemData.formalCharge),
          physicalDescription: safeString(pubchemData.physicalDescription),
          colorForm: safeString(pubchemData.colorForm),
          odor: safeString(pubchemData.odor),
          boilingPoint: safeString(pubchemData.boilingPoint),
          meltingPoint: safeString(pubchemData.meltingPoint),
          flashPoint: safeString(pubchemData.flashPoint),
          density: safeString(pubchemData.density),
          solubility: safeString(pubchemData.solubility),
          vaporPressure: safeString(pubchemData.vaporPressure),
          refractiveIndex: safeString(pubchemData.refractiveIndex),
          hazardClasses: safeString(pubchemData.hazardClasses),
          healthHazards: safeString(pubchemData.healthHazards),
          ghsClassification: safeString(pubchemData.ghsClassification),
          toxicitySummary: safeString(pubchemData.toxicitySummary),
          carcinogenicity: safeString(pubchemData.carcinogenicity),
          firstAid: safeString(pubchemData.firstAid),
          storageConditions: safeString(pubchemData.storageConditions),
          incompatibleMaterials: safeString(pubchemData.incompatibleMaterials),
          structureUrl: safeString(pubchemData.structureUrl),
          structureImageKey: safeString(pubchemData.structureImageKey),
          structureSdf: safeString(pubchemData.structureSdf),
          structure2dSvg: safeString(pubchemData.structure2dSvg),
          synonyms: pubchemData.synonyms && pubchemData.synonyms.length > 0 ? pubchemData.synonyms : null,
          applications: pubchemData.applications && pubchemData.applications.length > 0 ? pubchemData.applications : null,
          pubchemSyncedAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(schema.products.id, product.id));
      
      results.updated.push({ cas: trimmedCas, name: product.name, cid: pubchemData.cid });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error(`[Sync] Error updating ${trimmedCas}:`, error?.message);
      results.failed.push({ cas: trimmedCas, reason: error?.message || 'Unknown error' });
    }
  }
  
  return NextResponse.json({
    success: true,
    message: `Synced ${results.updated.length} products, ${results.failed.length} failed`,
    updated: results.updated.length,
    failed: results.failed.length,
    details: results,
  });
}

/**
 * 处理默认同步（同步所有需要更新的 SPU）
 */
async function handleDefaultSync(forceUpdate: boolean, limit: number) {
  const db = await getDb(schema);
  
  // 构建查询
  let query = sql`
    SELECT id, cas, name 
    FROM products 
    WHERE 1=1
  `;
  
  if (!forceUpdate) {
    query = sql`
      SELECT id, cas, name 
      FROM products 
      WHERE pubchem_cid IS NULL 
         OR pubchem_synced_at < NOW() - INTERVAL '30 days'
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT id, cas, name 
      FROM products 
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;
  }
  
  const spuResult = await db.execute(query);
  const spuList = spuResult.rows;
  
  if (spuList.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No SPU need to be updated',
      updated: 0,
      failed: 0,
    });
  }
  
  const results = { updated: [] as any[], failed: [] as any[] };
  
  for (const spu of spuList) {
    const { id, cas, name } = spu as any;
    
    console.log(`[Sync] Processing SPU CAS: ${cas}`);
    
    try {
      const pubchemData = await fetchPubChemData(cas);
      
      if (!pubchemData) {
        results.failed.push({ cas, name, reason: 'PubChem data not found' });
        continue;
      }
      
      await db.update(schema.products)
        .set({
          pubchemCid: pubchemData.cid || null,
          pubchemDataSource: 'pubchem',
          description: safeString(pubchemData.description),
          formula: safeString(pubchemData.formula),
          molecularWeight: safeString(pubchemData.molecularWeight),
          exactMass: safeString(pubchemData.exactMass),
          smiles: safeString(pubchemData.smiles),
          smilesCanonical: safeString(pubchemData.smilesCanonical),
          smilesIsomeric: safeString(pubchemData.smilesIsomeric),
          inchi: safeString(pubchemData.inchi),
          inchiKey: safeString(pubchemData.inchiKey),
          xlogp: safeString(pubchemData.xlogp),
          tpsa: safeString(pubchemData.tpsa),
          complexity: safeNumber(pubchemData.complexity),
          hBondDonorCount: safeNumber(pubchemData.hBondDonorCount),
          hBondAcceptorCount: safeNumber(pubchemData.hBondAcceptorCount),
          rotatableBondCount: safeNumber(pubchemData.rotatableBondCount),
          heavyAtomCount: safeNumber(pubchemData.heavyAtomCount),
          formalCharge: safeNumber(pubchemData.formalCharge),
          physicalDescription: safeString(pubchemData.physicalDescription),
          colorForm: safeString(pubchemData.colorForm),
          odor: safeString(pubchemData.odor),
          boilingPoint: safeString(pubchemData.boilingPoint),
          meltingPoint: safeString(pubchemData.meltingPoint),
          flashPoint: safeString(pubchemData.flashPoint),
          density: safeString(pubchemData.density),
          solubility: safeString(pubchemData.solubility),
          vaporPressure: safeString(pubchemData.vaporPressure),
          refractiveIndex: safeString(pubchemData.refractiveIndex),
          hazardClasses: safeString(pubchemData.hazardClasses),
          healthHazards: safeString(pubchemData.healthHazards),
          ghsClassification: safeString(pubchemData.ghsClassification),
          toxicitySummary: safeString(pubchemData.toxicitySummary),
          carcinogenicity: safeString(pubchemData.carcinogenicity),
          firstAid: safeString(pubchemData.firstAid),
          storageConditions: safeString(pubchemData.storageConditions),
          incompatibleMaterials: safeString(pubchemData.incompatibleMaterials),
          structureUrl: safeString(pubchemData.structureUrl),
          structureImageKey: safeString(pubchemData.structureImageKey),
          structureSdf: safeString(pubchemData.structureSdf),
          structure2dSvg: safeString(pubchemData.structure2dSvg),
          synonyms: pubchemData.synonyms && pubchemData.synonyms.length > 0 ? pubchemData.synonyms : null,
          applications: pubchemData.applications && pubchemData.applications.length > 0 ? pubchemData.applications : null,
          translations: sql`(
            SELECT jsonb_object_agg(key, value)
            FROM jsonb_each(COALESCE(translations, '{}'::jsonb))
            WHERE key NOT IN (
              'description', 'applications', 'boilingPoint', 'meltingPoint', 'flashPoint', 'hazardClasses', 
              'healthHazards', 'ghsClassification', 'firstAid', 'storageConditions', 
              'incompatibleMaterials', 'solubility', 'vaporPressure', 'refractiveIndex',
              'physicalDescription'
            )
          )::jsonb`,
          pubchemSyncedAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(schema.products.id, id as string));
      
      results.updated.push({ cas, name, cid: pubchemData.cid });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error(`[Sync] Error updating ${cas}:`, error?.message);
      results.failed.push({ cas, name, reason: error?.message || 'Unknown error' });
    }
  }
  
  return NextResponse.json({
    success: true,
    message: `Synced ${results.updated.length} SPU, ${results.failed.length} failed`,
    updated: results.updated.length,
    failed: results.failed.length,
    details: results,
  });
}
