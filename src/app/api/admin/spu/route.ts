import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { generateChemicalSVG, validateSVG } from '@/services/chemical-svg-generator';

/**
 * GET /api/admin/spu
 * 获取 SPU 列表（产品库）或单个 SPU
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // 如果提供了 id，返回单个 SPU
    if (id) {
      const result = await db.execute(sql`
        SELECT * FROM products WHERE id = ${id}
      `);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'SPU not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    }
    
    // 否则返回列表
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const conditions: string[] = ['1=1'];
    const countConditions: string[] = ['1=1'];
    
    if (search) {
      const sanitizedSearch = search.replace(/'/g, "''");
      // 搜索条件：CAS号、名称（中英文）、HS编码、翻译后的名称
      const searchCondition = `(
        p.cas ILIKE '%${sanitizedSearch}%' 
        OR p.name ILIKE '%${sanitizedSearch}%' 
        OR p.name_en ILIKE '%${sanitizedSearch}%'
        OR p.hs_code ILIKE '%${sanitizedSearch}%'
        OR p.translations::text ILIKE '%${sanitizedSearch}%'
      )`;
      conditions.push(searchCondition);
      const countSearchCondition = `(
        cas ILIKE '%${sanitizedSearch}%' 
        OR name ILIKE '%${sanitizedSearch}%' 
        OR name_en ILIKE '%${sanitizedSearch}%'
        OR hs_code ILIKE '%${sanitizedSearch}%'
        OR translations::text ILIKE '%${sanitizedSearch}%'
      )`;
      countConditions.push(countSearchCondition);
    }
    
    if (status) {
      conditions.push(`p.status = '${status.replace(/'/g, "''")}'`);
      countConditions.push(`status = '${status.replace(/'/g, "''")}'`);
    }
    
    const whereClause = conditions.join(' AND ');
    const countWhereClause = countConditions.join(' AND ');
    
    // 查询 SPU 列表，同时计算每个 SPU 的 SKU 数量
    const queryText = `
      SELECT 
        p.*,
        COALESCE(sku_counts.sku_count, 0) as sku_count
      FROM products p
      LEFT JOIN (
        SELECT spu_id, COUNT(*) as sku_count 
        FROM agent_products 
        GROUP BY spu_id
      ) sku_counts ON sku_counts.spu_id = p.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await db.execute(sql.raw(queryText));

    // 获取总数
    const countResult = await db.execute(sql.raw(`
      SELECT COUNT(*) as count FROM products WHERE ${countWhereClause}
    `));
    const total = parseInt((countResult.rows[0] as any)?.count || '0');

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching SPU list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SPU list' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/spu
 * 更新 SPU 信息
 */
export async function PUT(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const {
      id,
      name,
      nameEn,
      formula,
      molecularWeight,
      exactMass,
      description,
      synonyms,
      applications,
      hsCode,
      hsCodeExtensions,
      status,
      // 化学信息
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
      // 物理化学性质
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
      // 安全与毒性
      hazardClasses,
      healthHazards,
      ghsClassification,
      toxicitySummary,
      carcinogenicity,
      firstAid,
      storageConditions,
      incompatibleMaterials,
      // 翻译
      translations,
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'SPU ID is required' },
        { status: 400 }
      );
    }
    
    // 检查 SPU 是否存在
    const existingResult = await db.execute(sql`
      SELECT id FROM products WHERE id = ${id}
    `);
    
    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'SPU not found' },
        { status: 404 }
      );
    }
    
    // 如果只更新 status，使用简化的更新语句
    if (status !== undefined && name === undefined && nameEn === undefined && 
        formula === undefined && description === undefined && hsCode === undefined &&
        molecularWeight === undefined && synonyms === undefined && applications === undefined &&
        smiles === undefined && smilesCanonical === undefined && smilesIsomeric === undefined &&
        inchi === undefined && inchiKey === undefined && xlogp === undefined &&
        tpsa === undefined && complexity === undefined &&
        hBondDonorCount === undefined && hBondAcceptorCount === undefined &&
        rotatableBondCount === undefined && heavyAtomCount === undefined && formalCharge === undefined &&
        physicalDescription === undefined && colorForm === undefined && odor === undefined &&
        boilingPoint === undefined && meltingPoint === undefined && flashPoint === undefined &&
        density === undefined && solubility === undefined && vaporPressure === undefined &&
        refractiveIndex === undefined && hazardClasses === undefined && healthHazards === undefined &&
        ghsClassification === undefined && toxicitySummary === undefined && carcinogenicity === undefined &&
        firstAid === undefined && storageConditions === undefined &&
        incompatibleMaterials === undefined && translations === undefined && exactMass === undefined) {
      await db.execute(sql`
        UPDATE products SET
          status = ${status},
          updated_at = NOW()
        WHERE id = ${id}
      `);
    } else {
      // 完整更新（编辑场景）
      await db.execute(sql`
        UPDATE products SET
          name = COALESCE(${name ?? null}, name),
          name_en = COALESCE(${nameEn ?? null}, name_en),
          formula = COALESCE(${formula ?? null}, formula),
          molecular_weight = COALESCE(${molecularWeight ?? null}, molecular_weight),
          exact_mass = COALESCE(${exactMass ?? null}, exact_mass),
          description = COALESCE(${description ?? null}, description),
          synonyms = COALESCE(${synonyms ? JSON.stringify(synonyms) : null}::jsonb, synonyms),
          applications = COALESCE(${applications ? JSON.stringify(applications) : null}::jsonb, applications),
          hs_code = COALESCE(${hsCode ?? null}, hs_code),
          hs_code_extensions = COALESCE(${hsCodeExtensions ? JSON.stringify(hsCodeExtensions) : null}::jsonb, hs_code_extensions),
          status = COALESCE(${status ?? null}, status),
          smiles = COALESCE(${smiles ?? null}, smiles),
          smiles_canonical = COALESCE(${smilesCanonical ?? null}, smiles_canonical),
          smiles_isomeric = COALESCE(${smilesIsomeric ?? null}, smiles_isomeric),
          inchi = COALESCE(${inchi ?? null}, inchi),
          inchi_key = COALESCE(${inchiKey ?? null}, inchi_key),
          xlogp = COALESCE(${xlogp ?? null}, xlogp),
          tpsa = COALESCE(${tpsa ?? null}, tpsa),
          complexity = COALESCE(${complexity ?? null}, complexity),
          h_bond_donor_count = COALESCE(${hBondDonorCount ?? null}, h_bond_donor_count),
          h_bond_acceptor_count = COALESCE(${hBondAcceptorCount ?? null}, h_bond_acceptor_count),
          rotatable_bond_count = COALESCE(${rotatableBondCount ?? null}, rotatable_bond_count),
          heavy_atom_count = COALESCE(${heavyAtomCount ?? null}, heavy_atom_count),
          formal_charge = COALESCE(${formalCharge ?? null}, formal_charge),
          physical_description = COALESCE(${physicalDescription ?? null}, physical_description),
          color_form = COALESCE(${colorForm ?? null}, color_form),
          odor = COALESCE(${odor ?? null}, odor),
          boiling_point = COALESCE(${boilingPoint ?? null}, boiling_point),
          melting_point = COALESCE(${meltingPoint ?? null}, melting_point),
          flash_point = COALESCE(${flashPoint ?? null}, flash_point),
          density = COALESCE(${density ?? null}, density),
          solubility = COALESCE(${solubility ?? null}, solubility),
          vapor_pressure = COALESCE(${vaporPressure ?? null}, vapor_pressure),
          refractive_index = COALESCE(${refractiveIndex ?? null}, refractive_index),
          hazard_classes = COALESCE(${hazardClasses ?? null}, hazard_classes),
          health_hazards = COALESCE(${healthHazards ?? null}, health_hazards),
          ghs_classification = COALESCE(${ghsClassification ?? null}, ghs_classification),
          toxicity_summary = COALESCE(${toxicitySummary ?? null}, toxicity_summary),
          carcinogenicity = COALESCE(${carcinogenicity ?? null}, carcinogenicity),
          first_aid = COALESCE(${firstAid ?? null}, first_aid),
          storage_conditions = COALESCE(${storageConditions ?? null}, storage_conditions),
          incompatible_materials = COALESCE(${incompatibleMaterials ?? null}, incompatible_materials),
          translations = COALESCE(${translations ? JSON.stringify(translations) : null}::jsonb, translations),
          updated_at = NOW()
        WHERE id = ${id}
      `);
    }
    
    // 获取更新后的数据
    const result = await db.execute(sql`
      SELECT * FROM products WHERE id = ${id}
    `);
    const updatedSpu = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: updatedSpu,
      message: 'SPU updated successfully',
    });
  } catch (error) {
    console.error('Error updating SPU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SPU' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/spu
 * 删除 SPU（软删除，改为 INACTIVE 状态）
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'SPU ID is required' },
        { status: 400 }
      );
    }
    
    // 检查是否有关联的 SKU
    const skuCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM agent_products WHERE spu_id = ${id}
    `);
    
    const skuCount = parseInt((skuCountResult.rows[0] as any)?.count || '0');
    
    if (skuCount > 0) {
      // 有关联 SKU，只做软删除
      await db.execute(sql`
        UPDATE products SET status = 'INACTIVE', updated_at = NOW() WHERE id = ${id}
      `);
      
      return NextResponse.json({
        success: true,
        message: `SPU has ${skuCount} associated SKUs, status changed to INACTIVE`,
        softDelete: true,
      });
    }
    
    // 无关联 SKU，可以硬删除
    await db.execute(sql`
      DELETE FROM products WHERE id = ${id}
    `);
    
    return NextResponse.json({
      success: true,
      message: 'SPU deleted successfully',
      softDelete: false,
    });
  } catch (error) {
    console.error('Error deleting SPU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete SPU' },
      { status: 500 }
    );
  }
}
