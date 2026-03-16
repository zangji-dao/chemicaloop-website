/**
 * PubChem 数据到数据库字段的映射
 */

import { sql } from 'drizzle-orm';
import { PubChemData } from './types';
import { safeString, safeNumber } from './utils';

/**
 * 构建预览响应数据
 */
export function buildPreviewResponse(data: PubChemData, nameZh: string | null) {
  return {
    pubchemCid: data.cid,
    pubchemSyncedAt: new Date().toISOString(),
    nameZh,
    nameEn: data.synonyms?.[0] || null,
    formula: data.formula,
    molecularWeight: data.molecularWeight,
    exactMass: data.exactMass,
    smiles: data.smiles,
    smilesCanonical: data.smilesCanonical,
    smilesIsomeric: data.smilesIsomeric,
    inchi: data.inchi,
    inchiKey: data.inchiKey,
    xlogp: data.xlogp,
    tpsa: data.tpsa,
    complexity: data.complexity,
    hBondDonorCount: data.hBondDonorCount,
    hBondAcceptorCount: data.hBondAcceptorCount,
    rotatableBondCount: data.rotatableBondCount,
    heavyAtomCount: data.heavyAtomCount,
    formalCharge: data.formalCharge,
    description: data.description,
    physicalDescription: data.physicalDescription,
    colorForm: data.colorForm,
    odor: data.odor,
    boilingPoint: data.boilingPoint,
    meltingPoint: data.meltingPoint,
    flashPoint: data.flashPoint,
    density: data.density,
    solubility: data.solubility,
    vaporPressure: data.vaporPressure,
    refractiveIndex: data.refractiveIndex,
    hazardClasses: data.hazardClasses,
    healthHazards: data.healthHazards,
    ghsClassification: data.ghsClassification,
    toxicitySummary: data.toxicitySummary,
    carcinogenicity: data.carcinogenicity,
    firstAid: data.firstAid,
    storageConditions: data.storageConditions,
    incompatibleMaterials: data.incompatibleMaterials,
    synonyms: data.synonyms,
    applications: data.applications,
    structureUrl: data.structureUrl,
    structureImageKey: data.structureImageKey,
    structureSdf: data.structureSdf,
    structure2dSvg: data.structure2dSvg,
  };
}

/**
 * 将 PubChemData 转换为数据库更新字段对象
 * 用于 drizzle ORM 的 .set() 方法
 */
export function pubchemDataToUpdateFields(data: PubChemData, preserveTranslations: boolean = true): Record<string, any> {
  const fields: Record<string, any> = {
    pubchemCid: data.cid || null,
    pubchemDataSource: 'pubchem',
    
    // 基本信息
    description: safeString(data.description),
    formula: safeString(data.formula),
    molecularWeight: safeString(data.molecularWeight),
    exactMass: safeString(data.exactMass),
    
    // 标识符
    smiles: safeString(data.smiles),
    smilesCanonical: safeString(data.smilesCanonical),
    smilesIsomeric: safeString(data.smilesIsomeric),
    inchi: safeString(data.inchi),
    inchiKey: safeString(data.inchiKey),
    
    // 计算属性
    xlogp: safeString(data.xlogp),
    tpsa: safeString(data.tpsa),
    complexity: safeNumber(data.complexity),
    hBondDonorCount: safeNumber(data.hBondDonorCount),
    hBondAcceptorCount: safeNumber(data.hBondAcceptorCount),
    rotatableBondCount: safeNumber(data.rotatableBondCount),
    heavyAtomCount: safeNumber(data.heavyAtomCount),
    formalCharge: safeNumber(data.formalCharge),
    
    // 物理化学性质
    physicalDescription: safeString(data.physicalDescription),
    colorForm: safeString(data.colorForm),
    odor: safeString(data.odor),
    boilingPoint: safeString(data.boilingPoint),
    meltingPoint: safeString(data.meltingPoint),
    flashPoint: safeString(data.flashPoint),
    density: safeString(data.density),
    solubility: safeString(data.solubility),
    vaporPressure: safeString(data.vaporPressure),
    refractiveIndex: safeString(data.refractiveIndex),
    
    // 安全信息
    hazardClasses: safeString(data.hazardClasses),
    healthHazards: safeString(data.healthHazards),
    ghsClassification: safeString(data.ghsClassification),
    toxicitySummary: safeString(data.toxicitySummary),
    carcinogenicity: safeString(data.carcinogenicity),
    firstAid: safeString(data.firstAid),
    storageConditions: safeString(data.storageConditions),
    incompatibleMaterials: safeString(data.incompatibleMaterials),
    
    // 结构图
    structureUrl: safeString(data.structureUrl),
    structureImageKey: safeString(data.structureImageKey),
    structureSdf: safeString(data.structureSdf),
    structure2dSvg: safeString(data.structure2dSvg),
    
    // 数组字段
    synonyms: data.synonyms && data.synonyms.length > 0 ? data.synonyms : null,
    applications: data.applications && data.applications.length > 0 ? data.applications : null,
    
    // 时间戳
    pubchemSyncedAt: sql`NOW()`,
    updatedAt: sql`NOW()`,
  };
  
  // 保留非翻译字段（清除已更新字段的旧翻译）
  if (preserveTranslations) {
    fields.translations = sql`(
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(COALESCE(translations, '{}'::jsonb))
      WHERE key NOT IN (
        'description', 'applications', 'boilingPoint', 'meltingPoint', 'flashPoint', 'hazardClasses', 
        'healthHazards', 'ghsClassification', 'firstAid', 'storageConditions', 
        'incompatibleMaterials', 'solubility', 'vaporPressure', 'refractiveIndex',
        'physicalDescription'
      )
    )::jsonb`;
  }
  
  return fields;
}

/**
 * 将 PubChemData 转换为数据库插入字段对象
 * 用于创建新产品
 */
export function pubchemDataToInsertFields(data: PubChemData, cas: string, nameZh: string | null): Record<string, any> {
  return {
    cas,
    name: nameZh || data.synonyms?.[0] || cas,
    nameEn: data.synonyms?.[0] || null,
    formula: safeString(data.formula),
    description: safeString(data.description),
    pubchemCid: data.cid || null,
    pubchemDataSource: 'pubchem',
    status: 'DRAFT',
    
    // 标识符
    molecularWeight: safeString(data.molecularWeight),
    exactMass: safeString(data.exactMass),
    smiles: safeString(data.smiles),
    smilesCanonical: safeString(data.smilesCanonical),
    smilesIsomeric: safeString(data.smilesIsomeric),
    inchi: safeString(data.inchi),
    inchiKey: safeString(data.inchiKey),
    
    // 计算属性
    xlogp: safeString(data.xlogp),
    tpsa: safeString(data.tpsa),
    complexity: safeNumber(data.complexity),
    hBondDonorCount: safeNumber(data.hBondDonorCount),
    hBondAcceptorCount: safeNumber(data.hBondAcceptorCount),
    rotatableBondCount: safeNumber(data.rotatableBondCount),
    heavyAtomCount: safeNumber(data.heavyAtomCount),
    formalCharge: safeNumber(data.formalCharge),
    
    // 物理化学性质
    physicalDescription: safeString(data.physicalDescription),
    colorForm: safeString(data.colorForm),
    odor: safeString(data.odor),
    boilingPoint: safeString(data.boilingPoint),
    meltingPoint: safeString(data.meltingPoint),
    flashPoint: safeString(data.flashPoint),
    density: safeString(data.density),
    solubility: safeString(data.solubility),
    vaporPressure: safeString(data.vaporPressure),
    refractiveIndex: safeString(data.refractiveIndex),
    
    // 安全信息
    hazardClasses: safeString(data.hazardClasses),
    healthHazards: safeString(data.healthHazards),
    ghsClassification: safeString(data.ghsClassification),
    toxicitySummary: safeString(data.toxicitySummary),
    carcinogenicity: safeString(data.carcinogenicity),
    firstAid: safeString(data.firstAid),
    storageConditions: safeString(data.storageConditions),
    incompatibleMaterials: safeString(data.incompatibleMaterials),
    
    // 结构图
    structureUrl: safeString(data.structureUrl),
    structureImageKey: safeString(data.structureImageKey),
    structureSdf: safeString(data.structureSdf),
    structure2dSvg: safeString(data.structure2dSvg),
    
    // 数组字段
    synonyms: data.synonyms && data.synonyms.length > 0 ? JSON.stringify(data.synonyms) : null,
    applications: data.applications && data.applications.length > 0 ? JSON.stringify(data.applications) : null,
    
    // 时间戳（使用字符串，因为 INSERT 语句中直接拼接）
    pubchemSyncedAt: 'NOW()',
    createdAt: 'NOW()',
    updatedAt: 'NOW()',
  };
}
