import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * GET /api/admin/spu-manage/[id]
 * 获取单个 SPU 详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb(schema);

    const result = await db.execute(sql`
      SELECT 
        id,
        cas,
        name,
        name_en,
        formula,
        description,
        image_url,
        hs_code,
        hs_code_extensions,
        status,
        pubchem_cid,
        molecular_weight,
        exact_mass,
        smiles,
        smiles_canonical,
        smiles_isomeric,
        inchi,
        inchi_key,
        xlogp,
        tpsa,
        complexity,
        h_bond_donor_count,
        h_bond_acceptor_count,
        rotatable_bond_count,
        heavy_atom_count,
        formal_charge,
        structure_url,
        structure_image_key,
        structure_2d_svg,
        product_image_key,
        product_image_generated_at,
        physical_description,
        color_form,
        odor,
        boiling_point,
        melting_point,
        flash_point,
        density,
        solubility,
        vapor_pressure,
        refractive_index,
        hazard_classes,
        health_hazards,
        ghs_classification,
        toxicity_summary,
        carcinogenicity,
        first_aid,
        storage_conditions,
        incompatible_materials,
        synonyms,
        applications,
        translations,
        pubchem_synced_at,
        created_at,
        updated_at
      FROM products
      WHERE id = ${id}
      LIMIT 1
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
  } catch (error) {
    console.error('Error fetching SPU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SPU' },
      { status: 500 }
    );
  }
}
