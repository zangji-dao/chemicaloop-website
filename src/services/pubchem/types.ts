/**
 * PubChem 服务类型定义
 */

/**
 * 完整的 PubChem 数据结构
 */
export interface PubChemData {
  cid: number;
  
  // 标识符
  formula?: string | null;
  molecularWeight?: string | null;
  exactMass?: string | null;
  smiles?: string | null;
  smilesCanonical?: string | null;
  smilesIsomeric?: string | null;
  inchi?: string | null;
  inchiKey?: string | null;
  
  // 计算属性
  xlogp?: string | null;
  tpsa?: string | null;
  complexity?: number | null;
  hBondDonorCount?: number | null;
  hBondAcceptorCount?: number | null;
  rotatableBondCount?: number | null;
  heavyAtomCount?: number | null;
  formalCharge?: number | null;
  
  // 物理化学性质
  description?: string | null;
  physicalDescription?: string | null;
  colorForm?: string | null;
  odor?: string | null;
  boilingPoint?: string | null;
  meltingPoint?: string | null;
  flashPoint?: string | null;
  density?: string | null;
  solubility?: string | null;
  vaporPressure?: string | null;
  refractiveIndex?: string | null;
  
  // 安全信息
  hazardClasses?: string | null;
  healthHazards?: string | null;
  ghsClassification?: string | null;
  toxicitySummary?: string | null;
  carcinogenicity?: string | null;
  firstAid?: string | null;
  storageConditions?: string | null;
  incompatibleMaterials?: string | null;
  
  // 同义词与应用
  synonyms?: string[];
  applications?: string[];
  
  // 结构图片
  structureUrl?: string | null;
  structureImageKey?: string | null;
  structureSdf?: string | null;
  structure2dSvg?: string | null;
}

/**
 * 预览模式返回数据
 */
export interface PubChemPreviewData {
  pubchemCid: number;
  pubchemSyncedAt: string;
  
  // 基本信息
  nameZh: string | null;
  nameEn: string | null;
  formula: string | null;
  molecularWeight: string | null;
  exactMass: string | null;
  smiles: string | null;
  smilesCanonical: string | null;
  smilesIsomeric: string | null;
  inchi: string | null;
  inchiKey: string | null;
  
  // 计算属性
  xlogp: string | null;
  tpsa: string | null;
  complexity: number | null;
  hBondDonorCount: number | null;
  hBondAcceptorCount: number | null;
  rotatableBondCount: number | null;
  heavyAtomCount: number | null;
  formalCharge: number | null;
  
  // 物理化学性质
  description: string | null;
  physicalDescription: string | null;
  colorForm: string | null;
  odor: string | null;
  boilingPoint: string | null;
  meltingPoint: string | null;
  flashPoint: string | null;
  density: string | null;
  solubility: string | null;
  vaporPressure: string | null;
  refractiveIndex: string | null;
  
  // 安全信息
  hazardClasses: string | null;
  healthHazards: string | null;
  ghsClassification: string | null;
  toxicitySummary: string | null;
  carcinogenicity: string | null;
  firstAid: string | null;
  storageConditions: string | null;
  incompatibleMaterials: string | null;
  
  // 同义词和应用
  synonyms: string[] | undefined;
  applications: string[] | undefined;
  
  // 结构图
  structureUrl: string | null;
  structureImageKey: string | null;
  structureSdf: string | null;
  structure2dSvg: string | null;
}

/**
 * 同步请求参数
 */
export interface SyncRequest {
  preview?: boolean;
  cas?: string;
  forceUpdate?: boolean;
  limit?: number;
  casList?: string[] | null;
  createIfNotExist?: boolean;
}

/**
 * 同步统计
 */
export interface SyncStats {
  totalSpu: number;
  withPubchem: number;
  needSync: number;
  withPhysicalDesc: number;
  withHazard: number;
  withGhs: number;
  withFirstAid: number;
}

/**
 * PubChem API 配置
 */
export const PUBCHEM_CONFIG = {
  BASE_URL: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug',
  VIEW_URL: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view',
  FETCH_TIMEOUT: 60000,
  VIEW_TIMEOUT: 90000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
};
