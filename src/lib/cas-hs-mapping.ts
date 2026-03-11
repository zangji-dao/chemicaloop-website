/**
 * CAS 号到 HS 编码映射表
 * 
 * HS 编码说明：
 * - HS2: 章号 (如 29 = 有机化学品)
 * - HS4: 品目号 (如 2916 = 不饱和无环一元羧酸)
 * - HS6: 子目号 (如 291611 = 丙烯酸)
 * 
 * 数据来源：
 * - 中国海关税则
 * - EPA (美国环保署) CAS-HS 对照表
 * - 联合国贸易和发展会议 (UNCTAD)
 */

export interface CASHSMapping {
  cas: string;
  hsCode: string;
  hsCode6: string;
  hsCode4: string;
  hsCode2: string;
  name: string;
  nameEn: string;
  description?: string;
}

/**
 * 常见化学品 CAS → HS 编码映射表
 * 重点覆盖化工产品
 */
export const CAS_HS_MAPPINGS: Record<string, CASHSMapping> = {
  // 第29章：有机化学品
  
  // 2916 不饱和无环一元羧酸及其酸酐、酰卤化物、过氧化物和过氧酸
  '79-10-7': {
    cas: '79-10-7',
    hsCode: '291611',
    hsCode6: '291611',
    hsCode4: '2916',
    hsCode2: '29',
    name: '丙烯酸',
    nameEn: 'Acrylic acid',
    description: '用于生产丙烯酸酯、聚合物等',
  },
  '107-13-1': {
    cas: '107-13-1',
    hsCode: '291612',
    hsCode6: '291612',
    hsCode4: '2916',
    hsCode2: '29',
    name: '丙烯酸酯',
    nameEn: 'Acrylates',
  },
  '140-88-5': {
    cas: '140-88-5',
    hsCode: '291612',
    hsCode6: '291612',
    hsCode4: '2916',
    hsCode2: '29',
    name: '丙烯酸乙酯',
    nameEn: 'Ethyl acrylate',
  },
  '818-61-1': {
    cas: '818-61-1',
    hsCode: '291612',
    hsCode6: '291612',
    hsCode4: '2916',
    hsCode2: '29',
    name: '丙烯酸羟乙酯',
    nameEn: 'Hydroxyethyl acrylate',
  },
  
  // 2915 饱和无环一元羧酸及其酸酐、酰卤化物、过氧化物和过氧酸
  '64-19-7': {
    cas: '64-19-7',
    hsCode: '291521',
    hsCode6: '291521',
    hsCode4: '2915',
    hsCode2: '29',
    name: '乙酸',
    nameEn: 'Acetic acid',
  },
  '141-78-6': {
    cas: '141-78-6',
    hsCode: '291524',
    hsCode6: '291524',
    hsCode4: '2915',
    hsCode2: '29',
    name: '乙酸乙酯',
    nameEn: 'Ethyl acetate',
  },
  '108-21-4': {
    cas: '108-21-4',
    hsCode: '291525',
    hsCode6: '291525',
    hsCode4: '2915',
    hsCode2: '29',
    name: '乙酸异丙酯',
    nameEn: 'Isopropyl acetate',
  },
  '108-38-3': {
    cas: '108-38-3',
    hsCode: '291533',
    hsCode6: '291533',
    hsCode4: '2915',
    hsCode2: '29',
    name: '苯二甲酸二甲酯',
    nameEn: 'Dimethyl phthalate',
  },
  
  // 2905 无环醇及其卤化、磺化、硝化或亚硝化衍生物
  '67-56-1': {
    cas: '67-56-1',
    hsCode: '290511',
    hsCode6: '290511',
    hsCode4: '2905',
    hsCode2: '29',
    name: '甲醇',
    nameEn: 'Methanol',
  },
  '64-17-5': {
    cas: '64-17-5',
    hsCode: '220710', // 乙醇属于第22章
    hsCode6: '220710',
    hsCode4: '2207',
    hsCode2: '22',
    name: '乙醇',
    nameEn: 'Ethanol',
  },
  '67-63-0': {
    cas: '67-63-0',
    hsCode: '290512',
    hsCode6: '290512',
    hsCode4: '2905',
    hsCode2: '29',
    name: '异丙醇',
    nameEn: 'Isopropyl alcohol',
  },
  '57-55-6': {
    cas: '57-55-6',
    hsCode: '290532',
    hsCode6: '290532',
    hsCode4: '2905',
    hsCode2: '29',
    name: '丙二醇',
    nameEn: 'Propylene glycol',
  },
  '107-21-1': {
    cas: '107-21-1',
    hsCode: '290531',
    hsCode6: '290531',
    hsCode4: '2905',
    hsCode2: '29',
    name: '乙二醇',
    nameEn: 'Ethylene glycol',
  },
  '111-27-3': {
    cas: '111-27-3',
    hsCode: '290515',
    hsCode6: '290515',
    hsCode4: '2905',
    hsCode2: '29',
    name: '正己醇',
    nameEn: '1-Hexanol',
  },
  
  // 2902 环烃
  '71-43-2': {
    cas: '71-43-2',
    hsCode: '290220',
    hsCode6: '290220',
    hsCode4: '2902',
    hsCode2: '29',
    name: '苯',
    nameEn: 'Benzene',
  },
  '108-88-3': {
    cas: '108-88-3',
    hsCode: '290230',
    hsCode6: '290230',
    hsCode4: '2902',
    hsCode2: '29',
    name: '甲苯',
    nameEn: 'Toluene',
  },
  '1330-20-7': {
    cas: '1330-20-7',
    hsCode: '290244',
    hsCode6: '290244',
    hsCode4: '2902',
    hsCode2: '29',
    name: '二甲苯',
    nameEn: 'Xylene',
  },
  '100-41-4': {
    cas: '100-41-4',
    hsCode: '290260',
    hsCode6: '290260',
    hsCode4: '2902',
    hsCode2: '29',
    name: '乙苯',
    nameEn: 'Ethylbenzene',
  },
  '108-90-7': {
    cas: '108-90-7',
    hsCode: '290312',
    hsCode6: '290312',
    hsCode4: '2903',
    hsCode2: '29',
    name: '氯苯',
    nameEn: 'Chlorobenzene',
  },
  
  // 2901 无环烃
  '74-84-0': {
    cas: '74-84-0',
    hsCode: '290110',
    hsCode6: '290110',
    hsCode4: '2901',
    hsCode2: '29',
    name: '乙烷',
    nameEn: 'Ethane',
  },
  '74-98-6': {
    cas: '74-98-6',
    hsCode: '271119',
    hsCode6: '271119',
    hsCode4: '2711',
    hsCode2: '27',
    name: '丙烷',
    nameEn: 'Propane',
  },
  '106-97-8': {
    cas: '106-97-8',
    hsCode: '271119',
    hsCode6: '271119',
    hsCode4: '2711',
    hsCode2: '27',
    name: '丁烷',
    nameEn: 'Butane',
  },
  
  // 2933 杂环化合物（含氮杂环）
  '110-91-8': {
    cas: '110-91-8',
    hsCode: '293319',
    hsCode6: '293319',
    hsCode4: '2933',
    hsCode2: '29',
    name: '吗啉',
    nameEn: 'Morpholine',
  },
  '288-32-4': {
    cas: '288-32-4',
    hsCode: '293329',
    hsCode6: '293329',
    hsCode4: '2933',
    hsCode2: '29',
    name: '咪唑',
    nameEn: 'Imidazole',
  },
  // 8-羟基喹啉
  '148-24-3': {
    cas: '148-24-3',
    hsCode: '293349',
    hsCode6: '293349',
    hsCode4: '2933',
    hsCode2: '29',
    name: '8-羟基喹啉',
    nameEn: '8-Hydroxyquinoline',
    description: '喹啉衍生物，用于医药、农药、金属螯合剂等',
  },
  '109-99-9': {
    cas: '109-99-9',
    hsCode: '293211',
    hsCode6: '293211',
    hsCode4: '2932',
    hsCode2: '29',
    name: '四氢呋喃',
    nameEn: 'Tetrahydrofuran',
  },
  
  // 2922 氨基醇
  '141-43-5': {
    cas: '141-43-5',
    hsCode: '292215',
    hsCode6: '292215',
    hsCode4: '2922',
    hsCode2: '29',
    name: '乙醇胺',
    nameEn: 'Ethanolamine',
  },
  '111-42-2': {
    cas: '111-42-2',
    hsCode: '292215',
    hsCode6: '292215',
    hsCode4: '2922',
    hsCode2: '29',
    name: '二乙醇胺',
    nameEn: 'Diethanolamine',
  },
  '102-71-6': {
    cas: '102-71-6',
    hsCode: '292215',
    hsCode6: '292215',
    hsCode4: '2922',
    hsCode2: '29',
    name: '三乙醇胺',
    nameEn: 'Triethanolamine',
  },
  
  // 2921 氨基化合物
  '62-53-3': {
    cas: '62-53-3',
    hsCode: '292141',
    hsCode6: '292141',
    hsCode4: '2921',
    hsCode2: '29',
    name: '苯胺',
    nameEn: 'Aniline',
  },
  '100-46-9': {
    cas: '100-46-9',
    hsCode: '292149',
    hsCode6: '292149',
    hsCode4: '2921',
    hsCode2: '29',
    name: '苯甲胺',
    nameEn: 'Benzylamine',
  },
  
  // 2909 醚、醚醇、醚酚
  '115-10-6': {
    cas: '115-10-6',
    hsCode: '290911',
    hsCode6: '290911',
    hsCode4: '2909',
    hsCode2: '29',
    name: '二甲醚',
    nameEn: 'Dimethyl ether',
  },
  '109-86-4': {
    cas: '109-86-4',
    hsCode: '290919',
    hsCode6: '290919',
    hsCode4: '2909',
    hsCode2: '29',
    name: '乙二醇单甲醚',
    nameEn: 'Ethylene glycol monomethyl ether',
  },
  
  // 2908 酚及酚醇的卤化、磺化、硝化或亚硝化衍生物
  '106-44-5': {
    cas: '106-44-5',
    hsCode: '290712',
    hsCode6: '290712',
    hsCode4: '2907',
    hsCode2: '29',
    name: '对甲酚',
    nameEn: 'p-Cresol',
  },
  '108-95-2': {
    cas: '108-95-2',
    hsCode: '290711',
    hsCode6: '290711',
    hsCode4: '2907',
    hsCode2: '29',
    name: '苯酚',
    nameEn: 'Phenol',
  },
  
  // 2906 环醇及其卤化、磺化、硝化或亚硝化衍生物
  '108-10-1': {
    cas: '108-10-1',
    hsCode: '291413',
    hsCode6: '291413',
    hsCode4: '2914',
    hsCode2: '29',
    name: '甲基异丁基酮',
    nameEn: 'Methyl isobutyl ketone',
  },
  
  // 2914 酮及醌
  '67-64-1': {
    cas: '67-64-1',
    hsCode: '291411',
    hsCode6: '291411',
    hsCode4: '2914',
    hsCode2: '29',
    name: '丙酮',
    nameEn: 'Acetone',
  },
  '78-93-3': {
    cas: '78-93-3',
    hsCode: '291412',
    hsCode6: '291412',
    hsCode4: '2914',
    hsCode2: '29',
    name: '丁酮',
    nameEn: 'Butanone',
  },
  '108-94-1': {
    cas: '108-94-1',
    hsCode: '291422',
    hsCode6: '291422',
    hsCode4: '2914',
    hsCode2: '29',
    name: '环己酮',
    nameEn: 'Cyclohexanone',
  },
  
  // 2917 多元羧酸及其酸酐、酰卤化物等
  '110-15-6': {
    cas: '110-15-6',
    hsCode: '291719',
    hsCode6: '291719',
    hsCode4: '2917',
    hsCode2: '29',
    name: '琥珀酸',
    nameEn: 'Succinic acid',
  },
  '88-99-3': {
    cas: '88-99-3',
    hsCode: '291736',
    hsCode6: '291736',
    hsCode4: '2917',
    hsCode2: '29',
    name: '邻苯二甲酸',
    nameEn: 'Phthalic acid',
  },
  
  // 2918 含其他含氧基羧酸及其酸酐等
  '50-21-5': {
    cas: '50-21-5',
    hsCode: '291811',
    hsCode6: '291811',
    hsCode4: '2918',
    hsCode2: '29',
    name: '乳酸',
    nameEn: 'Lactic acid',
  },
  '56-81-5': {
    cas: '56-81-5',
    hsCode: '290545',
    hsCode6: '290545',
    hsCode4: '2905',
    hsCode2: '29',
    name: '甘油',
    nameEn: 'Glycerol',
  },
  '87-69-4': {
    cas: '87-69-4',
    hsCode: '291814',
    hsCode6: '291814',
    hsCode4: '2918',
    hsCode2: '29',
    name: '酒石酸',
    nameEn: 'Tartaric acid',
  },
  '77-92-9': {
    cas: '77-92-9',
    hsCode: '291814',
    hsCode6: '291814',
    hsCode4: '2918',
    hsCode2: '29',
    name: '柠檬酸',
    nameEn: 'Citric acid',
  },
  
  // 2934 核酸及其盐
  '73-40-5': {
    cas: '73-40-5',
    hsCode: '293359',
    hsCode6: '293359',
    hsCode4: '2933',
    hsCode2: '29',
    name: '鸟嘌呤',
    nameEn: 'Guanine',
  },
  
  // 2925 羧基酰胺基化合物
  '75-12-7': {
    cas: '75-12-7',
    hsCode: '292419',
    hsCode6: '292419',
    hsCode4: '2924',
    hsCode2: '29',
    name: '甲酰胺',
    nameEn: 'Formamide',
  },
  '68-12-2': {
    cas: '68-12-2',
    hsCode: '292419',
    hsCode6: '292419',
    hsCode4: '2924',
    hsCode2: '29',
    name: '二甲基甲酰胺',
    nameEn: 'Dimethylformamide',
  },
  '127-19-5': {
    cas: '127-19-5',
    hsCode: '292419',
    hsCode6: '292419',
    hsCode4: '2924',
    hsCode2: '29',
    name: 'N-甲基乙酰胺',
    nameEn: 'N-Methylacetamide',
  },
  
  // 2930 硫化物
  '75-18-3': {
    cas: '75-18-3',
    hsCode: '293090',
    hsCode6: '293090',
    hsCode4: '2930',
    hsCode2: '29',
    name: '二甲硫醚',
    nameEn: 'Dimethyl sulfide',
  },
  '75-15-0': {
    cas: '75-15-0',
    hsCode: '283090',
    hsCode6: '283090',
    hsCode4: '2830',
    hsCode2: '28',
    name: '二硫化碳',
    nameEn: 'Carbon disulfide',
  },
  
  // 第28章：无机化学品
  '7697-37-2': {
    cas: '7697-37-2',
    hsCode: '280800',
    hsCode6: '280800',
    hsCode4: '2808',
    hsCode2: '28',
    name: '硝酸',
    nameEn: 'Nitric acid',
  },
  '7664-93-9': {
    cas: '7664-93-9',
    hsCode: '280700',
    hsCode6: '280700',
    hsCode4: '2807',
    hsCode2: '28',
    name: '硫酸',
    nameEn: 'Sulfuric acid',
  },
  '7647-01-0': {
    cas: '7647-01-0',
    hsCode: '280610',
    hsCode6: '280610',
    hsCode4: '2806',
    hsCode2: '28',
    name: '盐酸',
    nameEn: 'Hydrochloric acid',
  },
  '1336-21-6': {
    cas: '1336-21-6',
    hsCode: '281420',
    hsCode6: '281420',
    hsCode4: '2814',
    hsCode2: '28',
    name: '氨水',
    nameEn: 'Ammonia solution',
  },
  '7664-41-7': {
    cas: '7664-41-7',
    hsCode: '281410',
    hsCode6: '281410',
    hsCode4: '2814',
    hsCode2: '28',
    name: '氨气',
    nameEn: 'Ammonia',
  },
  '1310-73-2': {
    cas: '1310-73-2',
    hsCode: '281512',
    hsCode6: '281512',
    hsCode4: '2815',
    hsCode2: '28',
    name: '氢氧化钠',
    nameEn: 'Sodium hydroxide',
  },
  '1310-58-3': {
    cas: '1310-58-3',
    hsCode: '281520',
    hsCode6: '281520',
    hsCode4: '2815',
    hsCode2: '28',
    name: '氢氧化钾',
    nameEn: 'Potassium hydroxide',
  },
  '7681-82-5': {
    cas: '7681-82-5',
    hsCode: '283090',
    hsCode6: '283090',
    hsCode4: '2830',
    hsCode2: '28',
    name: '碘化钠',
    nameEn: 'Sodium iodide',
  },
  '10043-35-3': {
    cas: '10043-35-3',
    hsCode: '284020',
    hsCode6: '284020',
    hsCode4: '2840',
    hsCode2: '28',
    name: '硼酸',
    nameEn: 'Boric acid',
  },
  '7758-02-3': {
    cas: '7758-02-3',
    hsCode: '283522',
    hsCode6: '283522',
    hsCode4: '2835',
    hsCode2: '28',
    name: '磷酸二氢钾',
    nameEn: 'Potassium dihydrogen phosphate',
  },
  
  // 38章：杂项化学产品
  '111-77-3': {
    cas: '111-77-3',
    hsCode: '290930',
    hsCode6: '290930',
    hsCode4: '2909',
    hsCode2: '29',
    name: '二乙二醇单甲醚',
    nameEn: 'Diethylene glycol monomethyl ether',
  },
  '112-34-5': {
    cas: '112-34-5',
    hsCode: '290943',
    hsCode6: '290943',
    hsCode4: '2909',
    hsCode2: '29',
    name: '二乙二醇单丁醚',
    nameEn: 'Diethylene glycol monobutyl ether',
  },
  '112-27-6': {
    cas: '112-27-6',
    hsCode: '290949',
    hsCode6: '290949',
    hsCode4: '2909',
    hsCode2: '29',
    name: '三乙二醇',
    nameEn: 'Triethylene glycol',
  },
};

/**
 * 根据 CAS 号获取 HS 编码映射
 */
export function getHSCodeByCAS(cas: string): CASHSMapping | null {
  // 标准化 CAS 号格式（去除空格、统一大小写）
  const normalizedCAS = cas.trim().toUpperCase();
  return CAS_HS_MAPPINGS[normalizedCAS] || null;
}

/**
 * 获取所有 CAS-HS 映射
 */
export function getAllCASMappings(): CASHSMapping[] {
  return Object.values(CAS_HS_MAPPINGS);
}

/**
 * 根据 HS 编码搜索相关化学品
 */
export function searchByHSCode(hsCode: string): CASHSMapping[] {
  const normalizedHS = hsCode.replace(/\s/g, '');
  return Object.values(CAS_HS_MAPPINGS).filter(
    (mapping) =>
      mapping.hsCode.startsWith(normalizedHS) ||
      mapping.hsCode6.startsWith(normalizedHS) ||
      mapping.hsCode4.startsWith(normalizedHS) ||
      mapping.hsCode2.startsWith(normalizedHS)
  );
}

/**
 * 获取 HS 章节名称
 */
export function getHSChapterName(hsCode2: string): string {
  const chapters: Record<string, string> = {
    '28': '无机化学品',
    '29': '有机化学品',
    '30': '药品',
    '38': '杂项化学产品',
    '22': '饮料、酒及醋',
    '27': '矿物燃料、矿物油及其蒸馏产品',
  };
  return chapters[hsCode2] || '其他';
}
