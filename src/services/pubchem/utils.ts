/**
 * PubChem 服务工具函数
 */

// 中文名称识别正则（包含中文Unicode范围）
const CHINESE_REGEX = /[\u4e00-\u9fff]+/;

/**
 * 从同义词列表中提取中文名称
 */
export function extractChineseName(synonyms: string[]): string | null {
  for (const synonym of synonyms) {
    if (CHINESE_REGEX.test(synonym)) {
      const chineseParts = synonym.match(/[\u4e00-\u9fff]+/g);
      if (chineseParts && chineseParts.length > 0) {
        const chineseName = chineseParts.find(part => part.length >= 2 && part.length <= 10);
        if (chineseName) return chineseName;
      }
    }
  }
  return null;
}

/**
 * 安全获取数值（处理空字符串和无效值）
 */
export function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

/**
 * 安全获取字符串（空字符串转 null）
 */
export function safeString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

/**
 * 合并数据（如果提取的数据是 "-" 表示无数据，保留当前值）
 */
export function mergeIfHasData(
  extractedValue: string | null | undefined,
  currentValue: string | null | undefined
): string | null {
  // 如果提取的数据是 "-"（表示 PubChem 无数据），保留当前值
  if (extractedValue === '-') {
    // 但如果当前值也是空的，就标记为 "-" 表示已查询但无数据
    return currentValue ?? '-';
  }
  // 否则使用提取的数据
  return extractedValue ?? currentValue ?? null;
}
