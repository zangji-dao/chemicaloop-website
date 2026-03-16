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
import { withAdminAuth } from '@/lib/withAuth';

import { PubChemData } from '@/services/pubchem/types';
import { fetchPubChemData } from '@/services/pubchem/api';
import { getCachedPreview, setCachedPreview } from '@/services/pubchem/cache';
import { extractChineseName } from '@/services/pubchem/utils';
import { pubchemDataToUpdateFields, buildPreviewResponse } from '@/services/pubchem/mapping';

/**
 * POST /api/admin/spu/create/sync-pubchem
 */
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { preview = false, cas, forceUpdate = false, limit = 10, casList, createIfNotExist = false } = body;
    
    // 预览模式
    if (preview && cas) {
      return handlePreview(cas);
    }
    
    // 单个 CAS 同步
    if (cas && !preview && !casList) {
      return handleSingleSync(cas, createIfNotExist);
    }
    
    // 批量同步（指定列表）
    if (casList && Array.isArray(casList)) {
      return handleBatchSync(casList);
    }
    
    // 默认批量同步
    return handleDefaultSync(forceUpdate, limit);
    
  } catch (error: any) {
    console.error('Error syncing PubChem data:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sync PubChem data' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/admin/spu/create/sync-pubchem
 * 获取同步统计信息
 */
export const GET = withAdminAuth(async () => {
  try {
    const db = await getDb(schema);
    
    const stats = await db.execute(sql`
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
    
    const s = stats.rows[0] as any;
    
    return NextResponse.json({
      success: true,
      data: {
        totalSpu: parseInt(s.total_spu || '0'),
        withPubchem: parseInt(s.with_pubchem || '0'),
        needSync: parseInt(s.need_sync || '0'),
        withPhysicalDesc: parseInt(s.with_physical_desc || '0'),
        withHazard: parseInt(s.with_hazard || '0'),
        withGhs: parseInt(s.with_ghs || '0'),
        withFirstAid: parseInt(s.with_first_aid || '0'),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
});

// ========== 处理函数 ==========

/** 预览模式 */
async function handlePreview(cas: string) {
  const trimmedCas = cas.trim();
  
  // 检查缓存
  const cached = getCachedPreview(trimmedCas);
  if (cached) {
    return NextResponse.json({ success: true, source: 'cache', data: cached });
  }
  
  const pubchemData = await fetchPubChemData(trimmedCas);
  if (!pubchemData) {
    return NextResponse.json({ success: false, error: 'PUBCHEM_NOT_FOUND', message: 'CAS号在 PubChem 中不存在' });
  }
  
  const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
  const responseData = buildPreviewResponse(pubchemData, nameZh);
  
  setCachedPreview(trimmedCas, responseData);
  
  return NextResponse.json({ success: true, source: 'pubchem', data: responseData });
}

/** 单个 CAS 同步 */
async function handleSingleSync(cas: string, createIfNotExist: boolean) {
  const db = await getDb(schema);
  const pubchemData = await fetchPubChemData(cas.trim());
  
  if (!pubchemData) {
    return NextResponse.json({ success: false, error: 'PUBCHEM_NOT_FOUND', message: 'CAS号在 PubChem 中不存在' });
  }
  
  const existing = await db.execute(sql`SELECT id, name FROM products WHERE cas = ${cas.trim()}`);
  
  if (existing.rows.length === 0) {
    if (!createIfNotExist) {
      const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
      return NextResponse.json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: '产品不存在，使用 createIfNotExist=true 创建新产品',
        pubchemData: buildPreviewResponse(pubchemData, nameZh),
      });
    }
    return createProduct(db, cas.trim(), pubchemData);
  }
  
  return updateProduct(db, (existing.rows[0] as any).id, pubchemData);
}

/** 批量同步 */
async function handleBatchSync(casList: string[]) {
  const db = await getDb(schema);
  const results = { updated: [] as any[], failed: [] as any[] };
  
  for (const cas of casList) {
    const trimmedCas = cas.trim();
    try {
      const pubchemData = await fetchPubChemData(trimmedCas);
      if (!pubchemData) {
        results.failed.push({ cas: trimmedCas, reason: 'PubChem 无数据' });
        continue;
      }
      
      const existing = await db.execute(sql`SELECT id, name FROM products WHERE cas = ${trimmedCas}`);
      if (existing.rows.length === 0) {
        results.failed.push({ cas: trimmedCas, reason: '产品不存在' });
        continue;
      }
      
      await db.update(schema.products)
        .set(pubchemDataToUpdateFields(pubchemData))
        .where(eq(schema.products.id, (existing.rows[0] as any).id));
      
      results.updated.push({ cas: trimmedCas, name: (existing.rows[0] as any).name, cid: pubchemData.cid });
      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      results.failed.push({ cas: trimmedCas, reason: e?.message });
    }
  }
  
  return NextResponse.json({ success: true, ...results, updated: results.updated.length, failed: results.failed.length });
}

/** 默认同步 */
async function handleDefaultSync(forceUpdate: boolean, limit: number) {
  const db = await getDb(schema);
  
  const query = forceUpdate
    ? sql`SELECT id, cas, name FROM products ORDER BY updated_at DESC LIMIT ${limit}`
    : sql`SELECT id, cas, name FROM products WHERE pubchem_cid IS NULL OR pubchem_synced_at < NOW() - INTERVAL '30 days' ORDER BY updated_at DESC LIMIT ${limit}`;
  
  const spuList = (await db.execute(query)).rows;
  
  if (spuList.length === 0) {
    return NextResponse.json({ success: true, message: '无需要更新的 SPU', updated: 0, failed: 0 });
  }
  
  const results = { updated: [] as any[], failed: [] as any[] };
  
  for (const spu of spuList) {
    const { id, cas, name } = spu as any;
    try {
      const pubchemData = await fetchPubChemData(cas);
      if (!pubchemData) {
        results.failed.push({ cas, name, reason: 'PubChem 无数据' });
        continue;
      }
      
      await db.update(schema.products)
        .set(pubchemDataToUpdateFields(pubchemData))
        .where(eq(schema.products.id, id));
      
      results.updated.push({ cas, name, cid: pubchemData.cid });
      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      results.failed.push({ cas, name, reason: e?.message });
    }
  }
  
  return NextResponse.json({ success: true, ...results, updated: results.updated.length, failed: results.failed.length });
}

/** 创建产品 */
async function createProduct(db: any, cas: string, pubchemData: PubChemData) {
  const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
  
  const result = await db.execute(sql`
    INSERT INTO products (
      cas, name, name_en, formula, description, pubchem_cid, pubchem_data_source, status,
      molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric, inchi, inchi_key,
      xlogp, tpsa, complexity, h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
      heavy_atom_count, formal_charge, physical_description, color_form, odor,
      boiling_point, melting_point, flash_point, density, solubility, vapor_pressure, refractive_index,
      hazard_classes, health_hazards, ghs_classification, toxicity_summary, carcinogenicity,
      first_aid, storage_conditions, incompatible_materials,
      structure_url, structure_image_key, structure_sdf, structure_2d_svg, synonyms, applications,
      pubchem_synced_at, created_at, updated_at
    ) VALUES (
      ${cas}, ${nameZh || pubchemData.synonyms?.[0] || cas}, ${pubchemData.synonyms?.[0] || null},
      ${pubchemData.formula || null}, ${pubchemData.description || null},
      ${pubchemData.cid || null}, 'pubchem', 'DRAFT',
      ${pubchemData.molecularWeight || null}, ${pubchemData.exactMass || null},
      ${pubchemData.smiles || null}, ${pubchemData.smilesCanonical || null}, ${pubchemData.smilesIsomeric || null},
      ${pubchemData.inchi || null}, ${pubchemData.inchiKey || null},
      ${pubchemData.xlogp || null}, ${pubchemData.tpsa || null}, ${pubchemData.complexity || null},
      ${pubchemData.hBondDonorCount || null}, ${pubchemData.hBondAcceptorCount || null}, ${pubchemData.rotatableBondCount || null},
      ${pubchemData.heavyAtomCount || null}, ${pubchemData.formalCharge || null},
      ${pubchemData.physicalDescription || null}, ${pubchemData.colorForm || null}, ${pubchemData.odor || null},
      ${pubchemData.boilingPoint || null}, ${pubchemData.meltingPoint || null}, ${pubchemData.flashPoint || null},
      ${pubchemData.density || null}, ${pubchemData.solubility || null}, ${pubchemData.vaporPressure || null}, ${pubchemData.refractiveIndex || null},
      ${pubchemData.hazardClasses || null}, ${pubchemData.healthHazards || null}, ${pubchemData.ghsClassification || null},
      ${pubchemData.toxicitySummary || null}, ${pubchemData.carcinogenicity || null},
      ${pubchemData.firstAid || null}, ${pubchemData.storageConditions || null}, ${pubchemData.incompatibleMaterials || null},
      ${pubchemData.structureUrl || null}, ${pubchemData.structureImageKey || null},
      ${pubchemData.structureSdf || null}, ${pubchemData.structure2dSvg || null},
      ${pubchemData.synonyms ? JSON.stringify(pubchemData.synonyms) : null},
      ${pubchemData.applications ? JSON.stringify(pubchemData.applications) : null},
      NOW(), NOW(), NOW()
    ) RETURNING id
  `);
  
  return NextResponse.json({ success: true, message: '产品创建成功', action: 'created', id: (result.rows[0] as any)?.id, cid: pubchemData.cid, nameZh });
}

/** 更新产品 */
async function updateProduct(db: any, productId: string, pubchemData: PubChemData) {
  await db.update(schema.products)
    .set(pubchemDataToUpdateFields(pubchemData))
    .where(eq(schema.products.id, productId));
  
  return NextResponse.json({ success: true, message: '产品更新成功', action: 'updated', id: productId, cid: pubchemData.cid });
}
