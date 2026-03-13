/**
 * UN Comtrade API 服务
 * 
 * 用于查询全球贸易统计数据
 * API 文档: https://comtradedeveloper.un.org/
 * 
 * 支持多 API Key 轮询和缓存机制
 */

import { getHSCodeByCAS, type CASHSMapping } from './cas-hs-mapping';
import { REPORTER_COUNTRIES, getCountryName } from '@/data/country-codes';

// UN Comtrade API 配置
const COMTRADE_API_BASE = 'https://comtradeapi.un.org/data/v1';

// 支持多个 API Key（环境变量用逗号分隔）
// 示例: UN_COMTRADE_API_KEYS=key1,key2,key3
const API_KEYS = (process.env.UN_COMTRADE_API_KEYS || process.env.UN_COMTRADE_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

// API Key 轮询状态
let currentKeyIndex = 0;
const keyUsageCount: Record<string, number> = {};
API_KEYS.forEach(key => { keyUsageCount[key] = 0; });

/**
 * 获取下一个可用的 API Key（轮询策略）
 */
function getNextApiKey(): string | null {
  if (API_KEYS.length === 0) {
    return null;
  }
  
  const key = API_KEYS[currentKeyIndex];
  keyUsageCount[key]++;
  
  // 轮询到下一个 Key
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  
  return key;
}

/**
 * 获取 API Key 使用统计
 */
export function getApiKeyStats(): { totalKeys: number; usage: Record<string, number> } {
  return {
    totalKeys: API_KEYS.length,
    usage: { ...keyUsageCount },
  };
}

// 简单内存缓存（贸易数据变化缓慢，可缓存较长时间）
const CACHE_TTL = 60 * 60 * 1000; // 1 小时
const cache = new Map<string, { data: any; expiry: number }>();

function getCacheKey(params: any, freq: string): string {
  return `${freq}:${params.reporterCode || '156'}:${params.period}:${params.cmdCode}:${params.flowCode}:${params.partnerCode || '0'}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// 贸易流向代码
export const FLOW_CODES: Record<string, string> = {
  'M': '进口',
  'X': '出口',
  'RX': '再出口',
  'RM': '再进口',
  'MIP': '进口-按原产地',
  'XIP': '出口-按目的地',
};

// 频率代码
export const FREQ_CODES: Record<string, string> = {
  'A': '年度',
  'M': '月度',
  'Q': '季度',
};

// API 响应类型
interface ComtradeDataItem {
  typeCode: string;
  freqCode: string;
  refPeriodId: number;
  refYear: number;
  refMonth: number;
  period: string;
  reporterCode: number;
  reporterISO: string | null;
  reporterDesc: string | null;
  flowCode: string;
  flowDesc: string | null;
  partnerCode: number;
  partnerISO: string | null;
  partnerDesc: string | null;
  partner2Code: number;
  partner2ISO: string | null;
  partner2Desc: string | null;
  classificationCode: string;
  classificationSearchCode: string;
  isOriginalClassification: boolean;
  cmdCode: string;
  cmdDesc: string | null;
  aggrLevel: number | null;
  isLeaf: boolean | null;
  customsCode: string;
  customsDesc: string | null;
  mosCode: string;
  motCode: number;
  motDesc: string | null;
  qtyUnitCode: number;
  qtyUnitAbbr: string | null;
  qty: number;
  isQtyEstimated: boolean;
  altQtyUnitCode: number;
  altQtyUnitAbbr: string | null;
  altQty: number;
  isAltQtyEstimated: boolean;
  netWgt: number | null;
  isNetWgtEstimated: boolean;
  grossWgt: number;
  isGrossWgtEstimated: boolean;
  cifvalue: number | null;
  fobvalue: number | null;
  primaryValue: number;
  legacyEstimationFlag: number;
  isReported: boolean;
  isAggregate: boolean;
}

interface ComtradeResponse {
  elapsedTime: string;
  count: number;
  data: ComtradeDataItem[];
  error: string;
}

// 贸易数据统计结果类型
export interface TradeDataResult {
  success: boolean;
  cas: string;
  productName: string;
  productNameEn: string;
  hsCode: string;
  hsCodeDesc: string;
  year: number;
  reporter: {
    code: string;
    name: string;
  };
  export: {
    value: number;           // 美元
    valueFormatted: string;  // 格式化后的金额
    quantity: number;        // 数量（吨）
    quantityFormatted: string;
  };
  import: {
    value: number;
    valueFormatted: string;
    quantity: number;
    quantityFormatted: string;
  };
  tradeBalance: {
    value: number;
    valueFormatted: string;
    type: 'surplus' | 'deficit' | 'balanced';
  };
  topExportPartners: TradePartner[];
  topImportPartners: TradePartner[];
  unitPrice: {
    export: number;  // 美元/吨
    import: number;
  };
  generatedAt: string;
  dataSource: string;
  disclaimer: string;
}

export interface TradePartner {
  code: string;
  name: string;
  value: number;
  valueFormatted: string;
  percentage: number;
}

/**
 * 格式化金额
 */
function formatValue(value: number, currency: string = 'USD'): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} 十亿美元`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} 百万美元`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} 千美元`;
  }
  return `${value.toFixed(2)} 美元`;
}

/**
 * 格式化数量
 */
function formatQuantity(quantity: number, unit: string = '吨'): string {
  if (quantity >= 1000000) {
    return `${(quantity / 1000000).toFixed(2)} 百万${unit}`;
  } else if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(2)} 千${unit}`;
  }
  return `${quantity.toFixed(2)} ${unit}`;
}

/**
 * 调用 UN Comtrade API（带重试机制）
 * @param params 查询参数
 * @param freq 频率: 'A' 年度, 'M' 月度, 'Q' 季度
 * 
 * UN Comtrade API 说明:
 * - 年度数据: /get/C/A/HS，period 格式为年份如 "2024"
 * - 月度数据: /get/C/M/HS，period 格式为 YYYYMM 如 "202401"
 * - 季度数据: /get/C/Q/HS，period 格式为 YYYYQn 如 "2024Q1"
 * 
 * 注意: 并非所有国家和商品都有月度/季度数据
 */
async function fetchComtradeData(params: {
  reporterCode?: string;
  partnerCode?: string;
  period: string;
  cmdCode: string;
  flowCode: string;
}, retryCount: number = 0, freq: 'A' | 'M' | 'Q' = 'A'): Promise<ComtradeDataItem[]> {
  // 检查缓存
  const cacheKey = getCacheKey(params, freq);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    console.log(`[Comtrade] Cache hit for ${cacheKey}`);
    return cachedData;
  }

  // 获取 API Key
  const apiKey = getNextApiKey();
  if (!apiKey) {
    throw new Error('UN_COMTRADE_API_KEY is not configured');
  }

  // 根据频率构建 API 端点
  // 正确格式: /data/v1/get/C/{freq}/HS
  const url = new URL(`${COMTRADE_API_BASE}/get/C/${freq}/HS`);
  
  // 添加查询参数
  if (params.reporterCode) {
    url.searchParams.set('reporterCode', params.reporterCode);
  }
  url.searchParams.set('period', params.period);
  url.searchParams.set('cmdCode', params.cmdCode);
  url.searchParams.set('flowCode', params.flowCode);
  url.searchParams.set('partnerCode', params.partnerCode || '0');

  const response = await fetch(url.toString(), {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // 处理速率限制 - 最多重试 3 次
    if (response.status === 429 && retryCount < 3) {
      // 从错误信息中提取等待时间
      const waitMatch = errorText.match(/Try again in (\d+) seconds?/i);
      const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) + 1 : 2;
      
      console.log(`[Comtrade] Rate limited, waiting ${waitSeconds}s before retry ${retryCount + 1}/3`);
      await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
      return fetchComtradeData(params, retryCount + 1, freq);
    }
    
    throw new Error(`Comtrade API error: ${response.status} - ${errorText}`);
  }

  const result: ComtradeResponse = await response.json();
  
  if (result.error) {
    throw new Error(`Comtrade API error: ${result.error}`);
  }

  // 缓存结果
  setCache(cacheKey, result.data);
  
  return result.data;
}

/**
 * 获取贸易数据统计
 * 自动尝试最近 3 年的数据（贸易数据通常有 1-2 年延迟）
 */
export async function getTradeData(
  cas: string,
  year?: number,
  reporterCode: string = '156' // 默认中国
): Promise<TradeDataResult | null> {
  // 1. 获取 HS 编码映射
  const mapping = getHSCodeByCAS(cas);
  if (!mapping) {
    console.warn(`No HS code mapping found for CAS: ${cas}`);
    return null;
  }

  // 默认查询前一年，如果没有数据则尝试更早的年份
  const currentYear = new Date().getFullYear();
  const yearsToTry = year 
    ? [year] 
    : [currentYear - 1, currentYear - 2, currentYear - 3];

  for (const tryYear of yearsToTry) {
    try {
      console.log(`[Comtrade] Trying year ${tryYear} for CAS: ${cas}, HS: ${mapping.hsCode6}`);
      
      // 2. 查询出口数据
      const exportData = await fetchComtradeData({
        reporterCode,
        period: tryYear.toString(),
        cmdCode: mapping.hsCode6,
        flowCode: 'X',
        partnerCode: '0', // 全球
      });

      // 3. 查询进口数据
      const importData = await fetchComtradeData({
        reporterCode,
        period: tryYear.toString(),
        cmdCode: mapping.hsCode6,
        flowCode: 'M',
        partnerCode: '0',
      });

      // 检查是否有有效数据
      const hasValidData = exportData.some(d => d.primaryValue > 0) || 
                           importData.some(d => d.primaryValue > 0);
      
      console.log(`[Comtrade] Year ${tryYear}: exportData=${exportData.length} items, importData=${importData.length} items, hasValidData=${hasValidData}`);
      
      if (!hasValidData) {
        // 没有有效数据
        if (yearsToTry.indexOf(tryYear) < yearsToTry.length - 1) {
          console.log(`[Comtrade] No valid data for year ${tryYear}, trying earlier year...`);
          continue; // 尝试下一个年份
        } else {
          console.log(`[Comtrade] No valid data for year ${tryYear} (last year to try)`);
          // 最后一个年份，返回空数据
          return buildTradeDataResult(
            cas, mapping, tryYear, reporterCode,
            exportData, importData, [], []
          );
        }
      }

      // 有有效数据，继续获取贸易伙伴信息
      console.log(`[Comtrade] Found valid data for year ${tryYear}, fetching partner data...`);

      // 4. 查询主要贸易伙伴（出口）
      const exportPartnersData = await fetchComtradeData({
        reporterCode,
        period: tryYear.toString(),
        cmdCode: mapping.hsCode6,
        flowCode: 'X',
      });

      // 5. 查询主要贸易伙伴（进口）
      const importPartnersData = await fetchComtradeData({
        reporterCode,
        period: tryYear.toString(),
        cmdCode: mapping.hsCode6,
        flowCode: 'M',
      });

      // 使用找到的数据
      return buildTradeDataResult(
        cas, mapping, tryYear, reporterCode,
        exportData, importData, exportPartnersData, importPartnersData
      );
      
    } catch (error) {
      console.error(`[Comtrade] Error fetching data for year ${tryYear}:`, error);
      // 继续尝试下一个年份
    }
  }

  // 所有年份都失败
  console.warn(`[Comtrade] No data found for CAS: ${cas} in years ${yearsToTry.join(', ')}`);
  return null;
}

/**
 * 构建贸易数据结果
 */
function buildTradeDataResult(
  cas: string,
  mapping: CASHSMapping,
  year: number,
  reporterCode: string,
  exportData: ComtradeDataItem[],
  importData: ComtradeDataItem[],
  exportPartnersData: ComtradeDataItem[],
  importPartnersData: ComtradeDataItem[]
): TradeDataResult {

    // 6. 整理数据
    const exportItem = exportData[0];
    const importItem = importData[0];

    const exportValue = exportItem?.primaryValue || 0;
    const importValue = importItem?.primaryValue || 0;
    const exportQty = exportItem?.altQty || 0;
    const importQty = importItem?.altQty || 0;
    const tradeBalance = exportValue - importValue;

    // 处理贸易伙伴数据
    const totalExport = exportPartnersData.reduce((sum, item) => sum + item.primaryValue, 0);
    const totalImport = importPartnersData.reduce((sum, item) => sum + item.primaryValue, 0);

    const topExportPartners: TradePartner[] = exportPartnersData
      .filter(item => item.partnerCode !== 0) // 排除"全球"
      .sort((a, b) => b.primaryValue - a.primaryValue)
      .slice(0, 5)
      .map(item => ({
        code: item.partnerCode.toString(),
        name: getCountryName(item.partnerCode.toString(), 'zh'),
        value: item.primaryValue,
        valueFormatted: formatValue(item.primaryValue),
        percentage: totalExport > 0 ? (item.primaryValue / totalExport) * 100 : 0,
      }));

    const topImportPartners: TradePartner[] = importPartnersData
      .filter(item => item.partnerCode !== 0)
      .sort((a, b) => b.primaryValue - a.primaryValue)
      .slice(0, 5)
      .map(item => ({
        code: item.partnerCode.toString(),
        name: getCountryName(item.partnerCode.toString(), 'zh'),
        value: item.primaryValue,
        valueFormatted: formatValue(item.primaryValue),
        percentage: totalImport > 0 ? (item.primaryValue / totalImport) * 100 : 0,
      }));

    // 计算单价
    const exportUnitPrice = exportQty > 0 ? exportValue / exportQty : 0;
    const importUnitPrice = importQty > 0 ? importValue / importQty : 0;

    return {
      success: true,
      cas,
      productName: mapping.name,
      productNameEn: mapping.nameEn,
      hsCode: mapping.hsCode6,
      hsCodeDesc: mapping.description || '',
      year,
      reporter: {
        code: reporterCode,
        name: getCountryName(reporterCode, 'zh'),
      },
      export: {
        value: exportValue,
        valueFormatted: formatValue(exportValue),
        quantity: exportQty,
        quantityFormatted: formatQuantity(exportQty),
      },
      import: {
        value: importValue,
        valueFormatted: formatValue(importValue),
        quantity: importQty,
        quantityFormatted: formatQuantity(importQty),
      },
      tradeBalance: {
        value: tradeBalance,
        valueFormatted: formatValue(Math.abs(tradeBalance)),
        type: tradeBalance > 0 ? 'surplus' : tradeBalance < 0 ? 'deficit' : 'balanced',
      },
      topExportPartners,
      topImportPartners,
      unitPrice: {
        export: exportUnitPrice,
        import: importUnitPrice,
      },
      generatedAt: new Date().toISOString(),
      dataSource: 'un-comtrade',
      disclaimer: '数据来源于联合国商品贸易统计数据库 (UN Comtrade)，仅供参考。实际贸易数据可能因统计口径、报告延迟等因素存在差异。',
    };
}

/**
 * 获取多个年份的贸易数据趋势
 */
export async function getTradeDataTrend(
  cas: string,
  years: number[] = [2019, 2020, 2021, 2022, 2023],
  reporterCode: string = '156'
): Promise<{ year: number; exportValue: number; importValue: number }[]> {
  const mapping = getHSCodeByCAS(cas);
  if (!mapping) {
    return [];
  }

  const results = [];

  for (const year of years) {
    try {
      const [exportData, importData] = await Promise.all([
        fetchComtradeData({
          reporterCode,
          period: year.toString(),
          cmdCode: mapping.hsCode6,
          flowCode: 'X',
          partnerCode: '0',
        }),
        fetchComtradeData({
          reporterCode,
          period: year.toString(),
          cmdCode: mapping.hsCode6,
          flowCode: 'M',
          partnerCode: '0',
        }),
      ]);

      results.push({
        year,
        exportValue: exportData[0]?.primaryValue || 0,
        importValue: importData[0]?.primaryValue || 0,
      });
    } catch (error) {
      console.error(`Error fetching data for year ${year}:`, error);
      results.push({
        year,
        exportValue: 0,
        importValue: 0,
      });
    }
  }

  return results;
}

/**
 * 月度贸易数据项
 */
export interface MonthlyTradeDataItem {
  year: number;
  month: number;
  period: string; // 格式: YYYYMM
  exportValue: number;
  exportValueFormatted: string;
  importValue: number;
  importValueFormatted: string;
}

/**
 * 获取月度贸易数据
 * @param cas CAS 号
 * @param year 年份
 * @param months 月份列表，默认全年 [1-12]
 * @param reporterCode 报告国代码，默认中国
 */
export async function getMonthlyTradeData(
  cas: string,
  year: number,
  months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  reporterCode: string = '156'
): Promise<MonthlyTradeDataItem[]> {
  const mapping = getHSCodeByCAS(cas);
  if (!mapping) {
    return [];
  }

  const results: MonthlyTradeDataItem[] = [];

  for (const month of months) {
    try {
      const period = `${year}${month.toString().padStart(2, '0')}`;
      
      const [exportData, importData] = await Promise.all([
        fetchComtradeData({
          reporterCode,
          period,
          cmdCode: mapping.hsCode6,
          flowCode: 'X',
          partnerCode: '0',
        }, 0, 'M'), // 使用月度 API
        fetchComtradeData({
          reporterCode,
          period,
          cmdCode: mapping.hsCode6,
          flowCode: 'M',
          partnerCode: '0',
        }, 0, 'M'),
      ]);

      const exportValue = exportData[0]?.primaryValue || 0;
      const importValue = importData[0]?.primaryValue || 0;

      results.push({
        year,
        month,
        period,
        exportValue,
        exportValueFormatted: formatValue(exportValue),
        importValue,
        importValueFormatted: formatValue(importValue),
      });
    } catch (error) {
      console.error(`Error fetching monthly data for ${year}-${month}:`, error);
      results.push({
        year,
        month,
        period: `${year}${month.toString().padStart(2, '0')}`,
        exportValue: 0,
        exportValueFormatted: '0.00 美元',
        importValue: 0,
        importValueFormatted: '0.00 美元',
      });
    }
  }

  return results;
}

/**
 * 季度贸易数据项
 */
export interface QuarterlyTradeDataItem {
  year: number;
  quarter: number; // 1-4
  period: string; // 格式: YYYYQ1
  exportValue: number;
  exportValueFormatted: string;
  importValue: number;
  importValueFormatted: string;
}

/**
 * 获取季度贸易数据
 * @param cas CAS 号
 * @param year 年份
 * @param quarters 季度列表，默认全年 [1-4]
 * @param reporterCode 报告国代码，默认中国
 */
export async function getQuarterlyTradeData(
  cas: string,
  year: number,
  quarters: number[] = [1, 2, 3, 4],
  reporterCode: string = '156'
): Promise<QuarterlyTradeDataItem[]> {
  const mapping = getHSCodeByCAS(cas);
  if (!mapping) {
    return [];
  }

  const results: QuarterlyTradeDataItem[] = [];

  for (const quarter of quarters) {
    try {
      const period = `${year}Q${quarter}`;
      
      const [exportData, importData] = await Promise.all([
        fetchComtradeData({
          reporterCode,
          period,
          cmdCode: mapping.hsCode6,
          flowCode: 'X',
          partnerCode: '0',
        }, 0, 'Q'), // 使用季度 API
        fetchComtradeData({
          reporterCode,
          period,
          cmdCode: mapping.hsCode6,
          flowCode: 'M',
          partnerCode: '0',
        }, 0, 'Q'),
      ]);

      const exportValue = exportData[0]?.primaryValue || 0;
      const importValue = importData[0]?.primaryValue || 0;

      results.push({
        year,
        quarter,
        period,
        exportValue,
        exportValueFormatted: formatValue(exportValue),
        importValue,
        importValueFormatted: formatValue(importValue),
      });
    } catch (error) {
      console.error(`Error fetching quarterly data for ${year}Q${quarter}:`, error);
      results.push({
        year,
        quarter,
        period: `${year}Q${quarter}`,
        exportValue: 0,
        exportValueFormatted: '0.00 美元',
        importValue: 0,
        importValueFormatted: '0.00 美元',
      });
    }
  }

  return results;
}
