import { Router } from 'express';
import pool from '../db/db';
import { authMiddleware, adminOnlyMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有 SPU 路由都需要管理员权限
router.use(authMiddleware);
router.use(adminOnlyMiddleware);

/**
 * GET /api/admin/spu
 * 获取 SPU 列表
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (
        p.cas ILIKE $${paramIndex} 
        OR p.name ILIKE $${paramIndex} 
        OR p.name_en ILIKE $${paramIndex}
        OR p.hs_code ILIKE $${paramIndex}
        OR p.translations::text ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 查询 SPU 列表（含 SKU 数量）
    const listQuery = `
      SELECT 
        p.*,
        COALESCE(sku_counts.sku_count, 0) as sku_count
      FROM products p
      LEFT JOIN (
        SELECT spu_id, COUNT(*) as sku_count 
        FROM agent_products 
        GROUP BY spu_id
      ) sku_counts ON sku_counts.spu_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(listQuery, [...params, limit, offset]);

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM products p ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    res.json({
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
    console.error('Get SPU list error:', error);
    res.status(500).json({ success: false, error: '获取 SPU 列表失败' });
  }
});

/**
 * GET /api/admin/spu/:id
 * 获取单个 SPU 详情
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, cas, name, name_en, formula, description, image_url,
        hs_code, hs_code_extensions, status, pubchem_cid,
        molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
        inchi, inchi_key, xlogp, tpsa, complexity,
        h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
        heavy_atom_count, formal_charge,
        structure_url, structure_image_key, structure_2d_svg,
        product_image_key, product_image_generated_at,
        physical_description, color_form, odor,
        boiling_point, melting_point, flash_point, density,
        solubility, vapor_pressure, refractive_index,
        hazard_classes, health_hazards, ghs_classification,
        toxicity_summary, carcinogenicity, first_aid,
        storage_conditions, incompatible_materials,
        synonyms, applications, translations,
        pubchem_synced_at, created_at, updated_at
      FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SPU 不存在' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get SPU detail error:', error);
    res.status(500).json({ success: false, error: '获取 SPU 详情失败' });
  }
});

/**
 * POST /api/admin/spu
 * 创建 SPU
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      cas, name, nameEn, formula, description, pubchemCid,
      molecularWeight, exactMass, smiles, smilesCanonical, smilesIsomeric,
      inchi, inchiKey, xlogp, tpsa, complexity,
      hBondDonorCount, hBondAcceptorCount, rotatableBondCount,
      heavyAtomCount, formalCharge,
      boilingPoint, meltingPoint, flashPoint, density,
      solubility, vaporPressure, refractiveIndex,
      hazardClasses, healthHazards, ghsClassification,
      toxicitySummary, carcinogenicity, firstAid,
      storageConditions, incompatibleMaterials,
      physicalDescription, colorForm, odor,
      synonyms, applications, hsCode, hsCodeExtensions,
      translations, status,
    } = req.body;

    // 验证必填字段
    if (!cas || !name) {
      return res.status(400).json({ success: false, error: 'CAS 和名称不能为空' });
    }

    // 检查是否已存在
    const existingResult = await pool.query(
      'SELECT id FROM products WHERE cas = $1',
      [cas]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: '该 CAS 已存在' });
    }

    // 插入新记录
    const insertResult = await pool.query(
      `INSERT INTO products (
        cas, name, name_en, formula, description, pubchem_cid,
        molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
        inchi, inchi_key, xlogp, tpsa, complexity,
        h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
        heavy_atom_count, formal_charge,
        boiling_point, melting_point, flash_point, density,
        solubility, vapor_pressure, refractive_index,
        hazard_classes, health_hazards, ghs_classification,
        toxicity_summary, carcinogenicity, first_aid,
        storage_conditions, incompatible_materials,
        physical_description, color_form, odor,
        synonyms, applications, hs_code, hs_code_extensions,
        translations, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
        NOW(), NOW()
      ) RETURNING id`,
      [
        cas, name, nameEn || null, formula || null, description || null, pubchemCid || null,
        molecularWeight || null, exactMass || null, smiles || null,
        smilesCanonical || null, smilesIsomeric || null,
        inchi || null, inchiKey || null, xlogp || null, tpsa || null, complexity || null,
        hBondDonorCount || null, hBondAcceptorCount || null, rotatableBondCount || null,
        heavyAtomCount || null, formalCharge || null,
        boilingPoint || null, meltingPoint || null, flashPoint || null, density || null,
        solubility || null, vaporPressure || null, refractiveIndex || null,
        hazardClasses || null, healthHazards || null, ghsClassification || null,
        toxicitySummary || null, carcinogenicity || null, firstAid || null,
        storageConditions || null, incompatibleMaterials || null,
        physicalDescription || null, colorForm || null, odor || null,
        synonyms ? JSON.stringify(synonyms) : null,
        applications ? JSON.stringify(applications) : null,
        hsCode || null, hsCodeExtensions ? JSON.stringify(hsCodeExtensions) : null,
        translations ? JSON.stringify(translations) : null,
        status || 'INACTIVE',
      ]
    );

    res.json({
      success: true,
      data: { id: insertResult.rows[0].id, cas, name },
      message: 'SPU 创建成功',
    });
  } catch (error) {
    console.error('Create SPU error:', error);
    res.status(500).json({ success: false, error: '创建 SPU 失败' });
  }
});

/**
 * PUT /api/admin/spu/:id
 * 更新 SPU
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查 SPU 是否存在
    const existingResult = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SPU 不存在' });
    }

    // 构建动态更新
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];
    let paramIndex = 2;

    const fieldMapping: Record<string, string> = {
      name: 'name',
      nameEn: 'name_en',
      formula: 'formula',
      description: 'description',
      pubchemCid: 'pubchem_cid',
      molecularWeight: 'molecular_weight',
      exactMass: 'exact_mass',
      smiles: 'smiles',
      smilesCanonical: 'smiles_canonical',
      smilesIsomeric: 'smiles_isomeric',
      inchi: 'inchi',
      inchiKey: 'inchi_key',
      xlogp: 'xlogp',
      tpsa: 'tpsa',
      complexity: 'complexity',
      hBondDonorCount: 'h_bond_donor_count',
      hBondAcceptorCount: 'h_bond_acceptor_count',
      rotatableBondCount: 'rotatable_bond_count',
      heavyAtomCount: 'heavy_atom_count',
      formalCharge: 'formal_charge',
      boilingPoint: 'boiling_point',
      meltingPoint: 'melting_point',
      flashPoint: 'flash_point',
      density: 'density',
      solubility: 'solubility',
      vaporPressure: 'vapor_pressure',
      refractiveIndex: 'refractive_index',
      hazardClasses: 'hazard_classes',
      healthHazards: 'health_hazards',
      ghsClassification: 'ghs_classification',
      toxicitySummary: 'toxicity_summary',
      carcinogenicity: 'carcinogenicity',
      firstAid: 'first_aid',
      storageConditions: 'storage_conditions',
      incompatibleMaterials: 'incompatible_materials',
      physicalDescription: 'physical_description',
      colorForm: 'color_form',
      odor: 'odor',
      hsCode: 'hs_code',
      hsCodeExtensions: 'hs_code_extensions',
      status: 'status',
      translations: 'translations',
      synonyms: 'synonyms',
      applications: 'applications',
    };

    for (const [key, dbField] of Object.entries(fieldMapping)) {
      if (updates[key] !== undefined) {
        let value = updates[key];
        
        // JSON 字段处理
        if (['synonyms', 'applications', 'hsCodeExtensions', 'translations'].includes(key)) {
          value = value ? JSON.stringify(value) : null;
        }
        
        setClauses.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 1) {
      return res.status(400).json({ success: false, error: '没有要更新的字段' });
    }

    const updateQuery = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $1`;
    await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'SPU 更新成功',
    });
  } catch (error) {
    console.error('Update SPU error:', error);
    res.status(500).json({ success: false, error: '更新 SPU 失败' });
  }
});

/**
 * DELETE /api/admin/spu/:id
 * 删除 SPU
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 检查是否有关联的 SKU
    const skuResult = await pool.query(
      'SELECT COUNT(*) as count FROM agent_products WHERE spu_id = $1',
      [id]
    );

    if (parseInt(skuResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: '该 SPU 下有关联的 SKU，无法删除',
      });
    }

    const deleteResult = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SPU 不存在' });
    }

    res.json({
      success: true,
      message: 'SPU 删除成功',
    });
  } catch (error) {
    console.error('Delete SPU error:', error);
    res.status(500).json({ success: false, error: '删除 SPU 失败' });
  }
});

/**
 * POST /api/admin/spu/save
 * 保存或更新 SPU（兼容原有接口）
 */
router.post('/save', async (req: AuthRequest, res) => {
  try {
    const {
      id, cas, name, nameEn, formula, description, pubchemCid,
      molecularWeight, exactMass, smiles, smilesCanonical, smilesIsomeric,
      inchi, inchiKey, xlogp, tpsa, complexity,
      hBondDonorCount, hBondAcceptorCount, rotatableBondCount,
      heavyAtomCount, formalCharge,
      boilingPoint, meltingPoint, flashPoint, density,
      solubility, vaporPressure, refractiveIndex,
      hazardClasses, healthHazards, ghsClassification,
      toxicitySummary, carcinogenicity, firstAid,
      storageConditions, incompatibleMaterials,
      physicalDescription, colorForm, odor,
      synonyms, applications, hsCode, hsCodeExtensions,
      translations, status,
    } = req.body;

    // 验证必填字段
    if (!cas || (!name && !nameEn)) {
      return res.status(400).json({ success: false, error: 'CAS 和名称不能为空' });
    }

    // 检查是否已存在该 CAS 的 SPU
    const existingResult = await pool.query(
      'SELECT id FROM products WHERE cas = $1',
      [cas]
    );

    const spuId = id || (existingResult.rows.length > 0 ? existingResult.rows[0].id : null);

    if (spuId) {
      // 更新现有 SPU
      await pool.query(
        `UPDATE products SET
          name = COALESCE($1, name),
          name_en = COALESCE($2, name_en),
          formula = COALESCE($3, formula),
          description = COALESCE($4, description),
          pubchem_cid = COALESCE($5, pubchem_cid),
          molecular_weight = COALESCE($6, molecular_weight),
          exact_mass = COALESCE($7, exact_mass),
          smiles = COALESCE($8, smiles),
          smiles_canonical = COALESCE($9, smiles_canonical),
          smiles_isomeric = COALESCE($10, smiles_isomeric),
          inchi = COALESCE($11, inchi),
          inchi_key = COALESCE($12, inchi_key),
          xlogp = COALESCE($13, xlogp),
          tpsa = COALESCE($14, tpsa),
          complexity = COALESCE($15, complexity),
          h_bond_donor_count = COALESCE($16, h_bond_donor_count),
          h_bond_acceptor_count = COALESCE($17, h_bond_acceptor_count),
          rotatable_bond_count = COALESCE($18, rotatable_bond_count),
          heavy_atom_count = COALESCE($19, heavy_atom_count),
          formal_charge = COALESCE($20, formal_charge),
          boiling_point = COALESCE($21, boiling_point),
          melting_point = COALESCE($22, melting_point),
          flash_point = COALESCE($23, flash_point),
          density = COALESCE($24, density),
          solubility = COALESCE($25, solubility),
          vapor_pressure = COALESCE($26, vapor_pressure),
          refractive_index = COALESCE($27, refractive_index),
          hazard_classes = COALESCE($28, hazard_classes),
          health_hazards = COALESCE($29, health_hazards),
          ghs_classification = COALESCE($30, ghs_classification),
          toxicity_summary = COALESCE($31, toxicity_summary),
          carcinogenicity = COALESCE($32, carcinogenicity),
          first_aid = COALESCE($33, first_aid),
          storage_conditions = COALESCE($34, storage_conditions),
          incompatible_materials = COALESCE($35, incompatible_materials),
          physical_description = COALESCE($36, physical_description),
          color_form = COALESCE($37, color_form),
          odor = COALESCE($38, odor),
          hs_code = COALESCE($39, hs_code),
          hs_code_extensions = COALESCE($40, hs_code_extensions),
          synonyms = COALESCE($41, synonyms),
          applications = COALESCE($42, applications),
          translations = COALESCE($43, translations),
          status = COALESCE($44, status),
          pubchem_synced_at = NOW(),
          updated_at = NOW()
        WHERE id = $45`,
        [
          name || null, nameEn || null, formula || null, description || null,
          pubchemCid || null, molecularWeight || null, exactMass || null,
          smiles || null, smilesCanonical || null, smilesIsomeric || null,
          inchi || null, inchiKey || null, xlogp || null, tpsa || null,
          complexity || null, hBondDonorCount || null, hBondAcceptorCount || null,
          rotatableBondCount || null, heavyAtomCount || null, formalCharge || null,
          boilingPoint || null, meltingPoint || null, flashPoint || null,
          density || null, solubility || null, vaporPressure || null,
          refractiveIndex || null, hazardClasses || null, healthHazards || null,
          ghsClassification || null, toxicitySummary || null, carcinogenicity || null,
          firstAid || null, storageConditions || null, incompatibleMaterials || null,
          physicalDescription || null, colorForm || null, odor || null,
          hsCode || null,
          hsCodeExtensions ? JSON.stringify(hsCodeExtensions) : null,
          synonyms ? JSON.stringify(synonyms) : null,
          applications ? JSON.stringify(applications) : null,
          translations ? JSON.stringify(translations) : null,
          status || null,
          spuId,
        ]
      );

      res.json({
        success: true,
        data: { id: spuId, cas, name, updated: true },
        message: 'SPU 更新成功',
      });
    } else {
      // 创建新 SPU
      const insertResult = await pool.query(
        `INSERT INTO products (
          cas, name, name_en, formula, description, pubchem_cid,
          molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
          inchi, inchi_key, xlogp, tpsa, complexity,
          h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
          heavy_atom_count, formal_charge,
          boiling_point, melting_point, flash_point, density,
          solubility, vapor_pressure, refractive_index,
          hazard_classes, health_hazards, ghs_classification,
          toxicity_summary, carcinogenicity, first_aid,
          storage_conditions, incompatible_materials,
          physical_description, color_form, odor,
          synonyms, applications, hs_code, hs_code_extensions,
          translations, status, pubchem_synced_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, NOW(), NOW(), NOW()
        ) RETURNING id`,
        [
          cas, name || nameEn, nameEn || null, formula || null, description || null,
          pubchemCid || null, molecularWeight || null, exactMass || null,
          smiles || null, smilesCanonical || null, smilesIsomeric || null,
          inchi || null, inchiKey || null, xlogp || null, tpsa || null,
          complexity || null, hBondDonorCount || null, hBondAcceptorCount || null,
          rotatableBondCount || null, heavyAtomCount || null, formalCharge || null,
          boilingPoint || null, meltingPoint || null, flashPoint || null,
          density || null, solubility || null, vaporPressure || null,
          refractiveIndex || null, hazardClasses || null, healthHazards || null,
          ghsClassification || null, toxicitySummary || null, carcinogenicity || null,
          firstAid || null, storageConditions || null, incompatibleMaterials || null,
          physicalDescription || null, colorForm || null, odor || null,
          synonyms ? JSON.stringify(synonyms) : null,
          applications ? JSON.stringify(applications) : null,
          hsCode || null,
          hsCodeExtensions ? JSON.stringify(hsCodeExtensions) : null,
          translations ? JSON.stringify(translations) : null,
          status || 'INACTIVE',
        ]
      );

      res.json({
        success: true,
        data: { id: insertResult.rows[0].id, cas, name, created: true },
        message: 'SPU 创建成功',
      });
    }
  } catch (error) {
    console.error('Save SPU error:', error);
    res.status(500).json({ success: false, error: '保存 SPU 失败' });
  }
});

/**
 * GET /api/admin/spu/search
 * 搜索 SPU（用于下拉选择等）
 */
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
    }

    const result = await pool.query(
      `SELECT id, cas, name, name_en, formula, status
       FROM products
       WHERE cas ILIKE $1 
         OR name ILIKE $1 
         OR name_en ILIKE $1
       ORDER BY 
         CASE WHEN cas ILIKE $2 THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT $3`,
      [`%${q}%`, `${q}%`, parseInt(limit as string)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Search SPU error:', error);
    res.status(500).json({ success: false, error: '搜索 SPU 失败' });
  }
});

export default router;
