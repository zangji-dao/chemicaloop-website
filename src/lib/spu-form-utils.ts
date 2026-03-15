/**
 * SPU 表单公共工具函数
 */

import { FormData } from '@/types/spu';

/**
 * 空表单数据
 */
export const emptyFormData: FormData = {
  cas: '',
  name: '',
  nameEn: '',
  formula: '',
  molecularWeight: '',
  exactMass: '',
  smiles: '',
  smilesCanonical: '',
  smilesIsomeric: '',
  inchi: '',
  inchiKey: '',
  xlogp: '',
  tpsa: '',
  complexity: '',
  hBondDonorCount: '',
  hBondAcceptorCount: '',
  rotatableBondCount: '',
  heavyAtomCount: '',
  formalCharge: '',
  physicalDescription: '',
  colorForm: '',
  odor: '',
  boilingPoint: '',
  meltingPoint: '',
  flashPoint: '',
  density: '',
  solubility: '',
  vaporPressure: '',
  refractiveIndex: '',
  hazardClasses: '',
  healthHazards: '',
  ghsClassification: '',
  toxicitySummary: '',
  carcinogenicity: '',
  firstAid: '',
  storageConditions: '',
  incompatibleMaterials: '',
  description: '',
  synonyms: [],
  applications: [],
  hsCode: '',
  hsCodeExtensions: {},
  status: 'ACTIVE',
};

/**
 * 可翻译字段配置
 */
export const TRANSLATABLE_FIELDS = [
  'name',
  'description',
  'physicalDescription',
  'boilingPoint',
  'meltingPoint',
  'flashPoint',
  'hazardClasses',
  'healthHazards',
  'ghsClassification',
  'firstAid',
  'storageConditions',
  'incompatibleMaterials',
  'solubility',
  'vaporPressure',
  'refractiveIndex',
] as const;

export type TranslatableField = typeof TRANSLATABLE_FIELDS[number];

/**
 * 获取可翻译字段列表（带值）
 */
export function getTranslatableFields(formData: FormData): Array<{ key: string; value: string }> {
  return [
    { key: 'name', value: formData.nameEn },
    { key: 'description', value: formData.description },
    { key: 'physicalDescription', value: formData.physicalDescription },
    { key: 'boilingPoint', value: formData.boilingPoint },
    { key: 'meltingPoint', value: formData.meltingPoint },
    { key: 'flashPoint', value: formData.flashPoint },
    { key: 'hazardClasses', value: formData.hazardClasses },
    { key: 'healthHazards', value: formData.healthHazards },
    { key: 'ghsClassification', value: formData.ghsClassification },
    { key: 'firstAid', value: formData.firstAid },
    { key: 'storageConditions', value: formData.storageConditions },
    { key: 'incompatibleMaterials', value: formData.incompatibleMaterials },
    { key: 'solubility', value: formData.solubility },
    { key: 'vaporPressure', value: formData.vaporPressure },
    { key: 'refractiveIndex', value: formData.refractiveIndex },
  ].filter((f): f is { key: string; value: string } => !!f.value);
}

/**
 * 构建保存 API 所需的数据结构
 */
export function buildSpuSavePayload(
  formData: FormData,
  options: {
    spuId?: string | null;
    pubchemCid?: string | number | null;
    structureSdf?: string | null;
    structureImageKey?: string | null;
    structure2dSvg?: string | null;
    productImageKey?: string | null;
    pendingTranslations?: Record<string, any>;
  } = {}
): Record<string, any> {
  const {
    spuId,
    pubchemCid,
    structureSdf,
    structureImageKey,
    structure2dSvg,
    productImageKey,
    pendingTranslations = {},
  } = options;

  // 将 pubchemCid 转换为字符串
  const pubchemCidStr = pubchemCid != null ? String(pubchemCid) : null;

  return {
    // ID（编辑模式）
    id: spuId || undefined,
    
    // 基础信息
    cas: formData.cas,
    name: formData.name || formData.nameEn,
    nameEn: formData.nameEn || null,
    formula: formData.formula || null,
    description: formData.description || null,
    
    // 分子信息
    molecularWeight: formData.molecularWeight || null,
    exactMass: formData.exactMass || null,
    smiles: formData.smiles || null,
    smilesCanonical: formData.smilesCanonical || null,
    smilesIsomeric: formData.smilesIsomeric || null,
    inchi: formData.inchi || null,
    inchiKey: formData.inchiKey || null,
    xlogp: formData.xlogp || null,
    tpsa: formData.tpsa || null,
    
    // 物理性质
    boilingPoint: formData.boilingPoint || null,
    meltingPoint: formData.meltingPoint || null,
    flashPoint: formData.flashPoint || null,
    density: formData.density || null,
    solubility: formData.solubility || null,
    vaporPressure: formData.vaporPressure || null,
    refractiveIndex: formData.refractiveIndex || null,
    physicalDescription: formData.physicalDescription || null,
    colorForm: formData.colorForm || null,
    odor: formData.odor || null,
    
    // 安全与毒性
    hazardClasses: formData.hazardClasses || null,
    healthHazards: formData.healthHazards || null,
    ghsClassification: formData.ghsClassification || null,
    toxicitySummary: formData.toxicitySummary || null,
    carcinogenicity: formData.carcinogenicity || null,
    firstAid: formData.firstAid || null,
    storageConditions: formData.storageConditions || null,
    incompatibleMaterials: formData.incompatibleMaterials || null,
    
    // HS 编码
    hsCode: formData.hsCode || null,
    hsCodeExtensions: formData.hsCodeExtensions || null,
    
    // 其他
    status: formData.status,
    synonyms: formData.synonyms || [],
    applications: formData.applications || [],
    
    // 翻译数据
    translations: Object.keys(pendingTranslations).length > 0 ? pendingTranslations : undefined,
    
    // PubChem 数据
    pubchemCid: pubchemCidStr,
    structureSdf: structureSdf || null,
    structureImageKey: structureImageKey || null,
    structure2dSvg: structure2dSvg || null,
    productImageKey: productImageKey || null,
  };
}

/**
 * 验证表单必填字段
 */
export function validateFormData(formData: FormData): { valid: boolean; error?: string } {
  if (!formData.cas) {
    return { valid: false, error: 'CAS号不能为空' };
  }
  if (!formData.name && !formData.nameEn) {
    return { valid: false, error: '产品名称不能为空' };
  }
  return { valid: true };
}

/**
 * 从 SPU 数据初始化表单（编辑模式）
 */
export function initFormDataFromSPUData(spu: Record<string, any>, locale: string): FormData {
  const currentLang = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'].includes(locale) 
    ? locale 
    : 'en';

  return {
    cas: spu.cas || '',
    name: spu.translations?.name?.[currentLang] || spu.name || '',
    nameEn: spu.nameEn || spu.name_en || '',
    formula: spu.formula || '',
    molecularWeight: spu.molecularWeight || spu.molecular_weight || '',
    exactMass: spu.exactMass || spu.exact_mass || '',
    description: spu.translations?.description?.[currentLang] || spu.description || '',
    synonyms: spu.synonyms || [],
    applications: spu.translations?.applications?.[currentLang] || spu.applications || [],
    hsCode: spu.hsCode || spu.hs_code || '',
    hsCodeExtensions: spu.hsCodeExtensions || spu.hs_code_extensions || {},
    status: spu.status || 'ACTIVE',
    smiles: spu.smiles || '',
    smilesCanonical: spu.smilesCanonical || spu.smiles_canonical || '',
    smilesIsomeric: spu.smilesIsomeric || spu.smiles_isomeric || '',
    inchi: spu.inchi || '',
    inchiKey: spu.inchiKey || spu.inchi_key || '',
    xlogp: spu.xlogp || '',
    tpsa: spu.tpsa || '',
    complexity: spu.complexity?.toString() || '',
    hBondDonorCount: spu.hBondDonorCount?.toString() || spu.h_bond_donor_count?.toString() || '',
    hBondAcceptorCount: spu.hBondAcceptorCount?.toString() || spu.h_bond_acceptor_count?.toString() || '',
    rotatableBondCount: spu.rotatableBondCount?.toString() || spu.rotatable_bond_count?.toString() || '',
    heavyAtomCount: spu.heavyAtomCount?.toString() || spu.heavy_atom_count?.toString() || '',
    formalCharge: spu.formalCharge?.toString() || spu.formal_charge?.toString() || '',
    physicalDescription: spu.translations?.physicalDescription?.[currentLang] || spu.physicalDescription || spu.physical_description || '',
    colorForm: spu.colorForm || spu.color_form || '',
    odor: spu.odor || '',
    boilingPoint: spu.translations?.boilingPoint?.[currentLang] || spu.boilingPoint || spu.boiling_point || '',
    meltingPoint: spu.translations?.meltingPoint?.[currentLang] || spu.meltingPoint || spu.melting_point || '',
    flashPoint: spu.translations?.flashPoint?.[currentLang] || spu.flashPoint || spu.flash_point || '',
    density: spu.density || '',
    solubility: spu.translations?.solubility?.[currentLang] || spu.solubility || '',
    vaporPressure: spu.translations?.vaporPressure?.[currentLang] || spu.vaporPressure || spu.vapor_pressure || '',
    refractiveIndex: spu.translations?.refractiveIndex?.[currentLang] || spu.refractiveIndex || spu.refractive_index || '',
    hazardClasses: spu.translations?.hazardClasses?.[currentLang] || spu.hazardClasses || spu.hazard_classes || '',
    healthHazards: spu.translations?.healthHazards?.[currentLang] || spu.healthHazards || spu.health_hazards || '',
    ghsClassification: spu.translations?.ghsClassification?.[currentLang] || spu.ghsClassification || spu.ghs_classification || '',
    toxicitySummary: spu.toxicitySummary || spu.toxicity_summary || '',
    carcinogenicity: spu.carcinogenicity || '',
    firstAid: spu.translations?.firstAid?.[currentLang] || spu.firstAid || spu.first_aid || '',
    storageConditions: spu.translations?.storageConditions?.[currentLang] || spu.storageConditions || spu.storage_conditions || '',
    incompatibleMaterials: spu.translations?.incompatibleMaterials?.[currentLang] || spu.incompatibleMaterials || spu.incompatible_materials || '',
  };
}

/**
 * 从预览数据初始化表单（新建模式）
 */
export function initFormDataFromPreview(previewData: Record<string, any>, cas: string): FormData {
  return {
    cas: cas,
    name: previewData.nameZh || '',
    nameEn: previewData.nameEn || '',
    formula: previewData.formula || '',
    molecularWeight: previewData.molecularWeight || '',
    exactMass: previewData.exactMass || '',
    smiles: previewData.smiles || '',
    smilesCanonical: previewData.smilesCanonical || '',
    smilesIsomeric: previewData.smilesIsomeric || '',
    inchi: previewData.inchi || '',
    inchiKey: previewData.inchiKey || '',
    xlogp: previewData.xlogp || '',
    tpsa: previewData.tpsa || '',
    complexity: previewData.complexity?.toString() || '',
    hBondDonorCount: previewData.hBondDonorCount?.toString() || '',
    hBondAcceptorCount: previewData.hBondAcceptorCount?.toString() || '',
    rotatableBondCount: previewData.rotatableBondCount?.toString() || '',
    heavyAtomCount: previewData.heavyAtomCount?.toString() || '',
    formalCharge: previewData.formalCharge?.toString() || '',
    physicalDescription: previewData.physicalDescription || '',
    colorForm: previewData.colorForm || '',
    odor: previewData.odor || '',
    boilingPoint: previewData.boilingPoint || '',
    meltingPoint: previewData.meltingPoint || '',
    flashPoint: previewData.flashPoint || '',
    density: previewData.density || '',
    solubility: previewData.solubility || '',
    vaporPressure: previewData.vaporPressure || '',
    refractiveIndex: previewData.refractiveIndex || '',
    hazardClasses: previewData.hazardClasses || '',
    healthHazards: previewData.healthHazards || '',
    ghsClassification: previewData.ghsClassification || '',
    toxicitySummary: previewData.toxicitySummary || '',
    carcinogenicity: previewData.carcinogenicity || '',
    firstAid: previewData.firstAid || '',
    storageConditions: previewData.storageConditions || '',
    incompatibleMaterials: previewData.incompatibleMaterials || '',
    description: previewData.description || '',
    synonyms: previewData.synonyms || [],
    applications: previewData.applications || [],
    hsCode: previewData.hsCode || '',
    hsCodeExtensions: {},
    status: 'ACTIVE',
  };
}
