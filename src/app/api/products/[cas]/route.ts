import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * GET /api/products/[cas]
 * 获取产品详情（公开API，无需登录）
 * 根据 CAS 号获取 SPU 信息和所有供应商报价
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cas: string }> }
) {
  try {
    const db = await getDb(schema);
    const { cas } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'zh';

    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }

    // 过滤 translations 字段，只保留当前语言
    const filterTranslations = (translations: any) => {
      if (!translations || typeof translations !== 'object') return translations;
      const result: any = {};
      for (const key of Object.keys(translations)) {
        const value = translations[key];
        if (value && typeof value === 'object' && locale in value) {
          result[key] = { [locale]: value[locale] };
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    const casEscaped = cas.replace(/'/g, "''");

    // 并行查询 SPU 和 suppliers
    const [spuResult, suppliersResult] = await Promise.all([
      db.execute(sql.raw(`
        SELECT 
          id, cas, name, name_en, formula, description, image_url, status,
          -- PubChem 基础信息
          pubchem_cid, pubchem_data_source, pubchem_synced_at,
          -- PubChem 标识符
          molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
          inchi, inchi_key, xlogp,
          -- PubChem 计算属性
          tpsa, complexity, h_bond_donor_count, h_bond_acceptor_count,
          rotatable_bond_count, heavy_atom_count, formal_charge,
          stereo_center_count, undefined_stereo_center_count, isotope_atom_count,
          -- PubChem 物理化学性质
          physical_description, color_form, odor,
          boiling_point, melting_point, flash_point, density, solubility, vapor_pressure,
          refractive_index, pka, henry_law_constant, auto_ignition_temp, decomposition_temp,
          surface_tension,
          -- PubChem 安全与毒性
          hazard_classes, health_hazards, ghs_classification, toxicity_summary,
          carcinogenicity, first_aid, storage_conditions, incompatible_materials,
          -- PubChem 结构图片
          structure_url, structure_image_key, structure_2d_svg, structure_3d_url,
          -- 产品图
          product_image_key, product_image_generated_at,
          -- 同义词与应用
          synonyms, applications, categories,
          -- HS 编码
          hs_code, hs_code_extensions,
          -- 多语言
          translations,
          -- 时间戳
          created_at, updated_at
        FROM products
        WHERE cas = '${casEscaped}'
      `)),
      db.execute(sql.raw(`
        SELECT 
          sku.id, sku.cas, sku.name, sku.purity, sku.package_spec, sku.price,
          sku.min_order, sku.stock, sku.stock_public, sku.origin, sku.remark,
          sku.image_key, sku.translations, sku.agent_id,
          u.name as agent_name, u.email as agent_email
        FROM agent_products sku
        LEFT JOIN users u ON sku.agent_id = u.id
        WHERE sku.cas = '${casEscaped}' AND sku.status = 'active'
        ORDER BY sku.price ASC
      `)),
    ]);

    if (spuResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const spu = spuResult.rows[0] as any;

    // 收集需要签名的图片 keys
    const imageKeys = suppliersResult.rows
      .map((row: any) => row.image_key)
      .filter((key: string | null) => key);

    let signedUrls: Record<string, string> = {};
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 收集所有需要签名的 keys
    const keysToSign = [...imageKeys];
    if (spu.image_url && !spu.image_url.startsWith('http')) {
      keysToSign.push(spu.image_url);
    }
    if (spu.structure_image_key) {
      keysToSign.push(spu.structure_image_key);
    }
    if (spu.product_image_key) {
      keysToSign.push(spu.product_image_key);
    }

    if (keysToSign.length > 0) {
      signedUrls = await Promise.all(
        keysToSign.map(async (key: string) => {
          const url = await storage.generatePresignedUrl({
            key,
            expireTime: 86400,
          });
          return { key, url };
        })
      ).then(results => Object.fromEntries(results.map(r => [r.key, r.url])));
    }

    const suppliers = suppliersResult.rows.map((row: any) => ({
      id: row.id,
      cas: row.cas,
      name: row.name,
      purity: row.purity,
      packageSpec: row.package_spec,
      price: row.price,
      minOrder: row.min_order,
      stock: row.stock,
      stockPublic: row.stock_public,
      origin: row.origin,
      remark: row.remark,
      imageKey: row.image_key,
      imageUrl: row.image_key ? signedUrls[row.image_key] : null,
      translations: filterTranslations(row.translations),
      agent: {
        id: row.agent_id,
        name: row.agent_name,
        email: row.agent_email,
      },
    }));

    const productData = {
      // 基础信息
      id: spu.id,
      cas: spu.cas,
      name: spu.name,
      nameEn: spu.name_en,
      formula: spu.formula,
      description: spu.description,
      imageUrl: spu.image_url?.startsWith('http') ? spu.image_url : (spu.image_url ? signedUrls[spu.image_url] : null),
      status: spu.status,
      
      // PubChem 基础信息
      pubchemCid: spu.pubchem_cid,
      pubchemDataSource: spu.pubchem_data_source,
      pubchemSyncedAt: spu.pubchem_synced_at,
      
      // PubChem 标识符
      molecularWeight: spu.molecular_weight,
      exactMass: spu.exact_mass,
      smiles: spu.smiles,
      smilesCanonical: spu.smiles_canonical,
      smilesIsomeric: spu.smiles_isomeric,
      inchi: spu.inchi,
      inchiKey: spu.inchi_key,
      xlogp: spu.xlogp,
      
      // PubChem 计算属性
      tpsa: spu.tpsa,
      complexity: spu.complexity,
      hBondDonorCount: spu.h_bond_donor_count,
      hBondAcceptorCount: spu.h_bond_acceptor_count,
      rotatableBondCount: spu.rotatable_bond_count,
      heavyAtomCount: spu.heavy_atom_count,
      formalCharge: spu.formal_charge,
      stereoCenterCount: spu.stereo_center_count,
      undefinedStereoCenterCount: spu.undefined_stereo_center_count,
      isotopeAtomCount: spu.isotope_atom_count,
      
      // PubChem 物理化学性质
      physicalDescription: spu.physical_description,
      colorForm: spu.color_form,
      odor: spu.odor,
      boilingPoint: spu.boiling_point,
      meltingPoint: spu.melting_point,
      flashPoint: spu.flash_point,
      density: spu.density,
      solubility: spu.solubility,
      vaporPressure: spu.vapor_pressure,
      refractiveIndex: spu.refractive_index,
      pka: spu.pka,
      henryLawConstant: spu.henry_law_constant,
      autoIgnitionTemp: spu.auto_ignition_temp,
      decompositionTemp: spu.decomposition_temp,
      surfaceTension: spu.surface_tension,
      
      // PubChem 安全与毒性
      hazardClasses: spu.hazard_classes,
      healthHazards: spu.health_hazards,
      ghsClassification: spu.ghs_classification,
      toxicitySummary: spu.toxicity_summary,
      carcinogenicity: spu.carcinogenicity,
      firstAid: spu.first_aid,
      storageConditions: spu.storage_conditions,
      incompatibleMaterials: spu.incompatible_materials,
      
      // PubChem 结构图片
      structureUrl: spu.structure_url,
      structureImageKey: spu.structure_image_key ? signedUrls[spu.structure_image_key] : null,
      structure2dSvg: spu.structure_2d_svg,
      structure3dUrl: spu.structure_3d_url,
      
      // 产品图
      productImageKey: spu.product_image_key ? signedUrls[spu.product_image_key] : null,
      productImageGeneratedAt: spu.product_image_generated_at,
      
      // 同义词与应用
      synonyms: spu.synonyms,
      applications: spu.applications,
      categories: spu.categories,
      
      // HS 编码
      hsCode: spu.hs_code,
      hsCodeExtensions: spu.hs_code_extensions,
      
      // 多语言
      translations: filterTranslations(spu.translations),
      
      // 供应商
      suppliers,
    };

    return NextResponse.json({
      success: true,
      data: productData,
    });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product detail' },
      { status: 500 }
    );
  }
}
