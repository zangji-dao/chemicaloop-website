/**
 * SPU (Standard Product Unit) 类型定义
 * 遵循项目记忆文档规范
 */

// SPU 数据接口（数据库结构）
export interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  description?: string;
  image_url?: string;
  hs_code?: string;
  hs_code_extensions?: Record<string, string>;
  status: string;
  pubchem_cid?: number;
  molecular_weight?: string;
  exact_mass?: string;
  smiles?: string;
  smiles_canonical?: string;
  smiles_isomeric?: string;
  inchi?: string;
  inchi_key?: string;
  xlogp?: string;
  tpsa?: string;
  complexity?: number;
  h_bond_donor_count?: number;
  h_bond_acceptor_count?: number;
  rotatable_bond_count?: number;
  heavy_atom_count?: number;
  formal_charge?: number;
  structure_url?: string;
  structure_image_key?: string;
  structure_2d_svg?: string;
  product_image_key?: string;
  product_image_generated_at?: string;
  physical_description?: string;
  color_form?: string;
  odor?: string;
  boiling_point?: string;
  melting_point?: string;
  flash_point?: string;
  density?: string;
  solubility?: string;
  vapor_pressure?: string;
  refractive_index?: string;
  hazard_classes?: string;
  health_hazards?: string;
  ghs_classification?: string;
  toxicity_summary?: string;
  carcinogenicity?: string;
  first_aid?: string;
  storage_conditions?: string;
  incompatible_materials?: string;
  synonyms?: string[];
  applications?: string[];
  translations?: Record<string, any>;
  pubchem_synced_at?: string;
}

// 表单数据类型
export interface FormData {
  cas: string;
  name: string;
  nameEn: string;
  formula: string;
  molecularWeight: string;
  exactMass: string;
  description: string;
  synonyms: string[];
  applications: string[];
  hsCode: string;
  hsCodeExtensions: Record<string, string>;
  status: string;
  smiles: string;
  smilesCanonical: string;
  smilesIsomeric: string;
  inchi: string;
  inchiKey: string;
  xlogp: string;
  tpsa: string;
  complexity: string;
  hBondDonorCount: string;
  hBondAcceptorCount: string;
  rotatableBondCount: string;
  heavyAtomCount: string;
  formalCharge: string;
  physicalDescription: string;
  colorForm: string;
  odor: string;
  boilingPoint: string;
  meltingPoint: string;
  flashPoint: string;
  density: string;
  solubility: string;
  vaporPressure: string;
  refractiveIndex: string;
  hazardClasses: string;
  healthHazards: string;
  ghsClassification: string;
  toxicitySummary: string;
  carcinogenicity: string;
  firstAid: string;
  storageConditions: string;
  incompatibleMaterials: string;
}

// 空表单数据
export const emptyFormData: FormData = {
  cas: '',
  name: '',
  nameEn: '',
  formula: '',
  molecularWeight: '',
  exactMass: '',
  description: '',
  synonyms: [],
  applications: [],
  hsCode: '',
  hsCodeExtensions: {},
  status: 'ACTIVE',
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
};

// HS编码国家扩展配置
export const hsCodeCountries = [
  { code: 'CN', name: '中国', digits: 10 },
  { code: 'US', name: '美国', digits: 10 },
  { code: 'EU', name: '欧盟', digits: 8 },
  { code: 'JP', name: '日本', digits: 9 },
  { code: 'KR', name: '韩国', digits: 10 },
];

// 同步进度状态
export interface SyncProgress {
  step: 'connecting' | 'fetching' | 'updating';
  message: string;
}

// 翻译进度状态
export interface TranslationProgress {
  current: number;
  total: number;
  status: 'idle' | 'translating' | 'completed';
}

// PubChem 信息
export interface PubChemInfo {
  cid?: number;
  syncedAt?: string;
}

// 弹窗配置
export interface DialogConfig {
  type: 'confirm' | 'success' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
}

// 可翻译字段列表
export const translatableFieldKeys = [
  'name',
  'description',
  'physicalDescription',
  'boilingPoint',
  'meltingPoint',
  'flashPoint',
  'solubility',
  'vaporPressure',
  'refractiveIndex',
  'hazardClasses',
  'healthHazards',
  'ghsClassification',
  'firstAid',
  'storageConditions',
  'incompatibleMaterials',
] as const;

export type TranslatableFieldKey = typeof translatableFieldKeys[number];
