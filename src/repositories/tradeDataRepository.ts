/**
 * 贸易数据数据库管理器
 * 
 * 负责从本地数据库读取和写入贸易数据
 */

import { eq, and, desc, between, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { tradeData, tradeDataSyncTasks } from "@/db";
import * as schema from "@/db";
import { getCountryName } from '@/data/country-codes';

// 类型定义
export type TradeDataRecord = typeof tradeData.$inferSelect;
export type TradeDataInsert = typeof tradeData.$inferInsert;
export type SyncTaskRecord = typeof tradeDataSyncTasks.$inferSelect;
export type SyncTaskInsert = typeof tradeDataSyncTasks.$inferInsert;

/**
 * 查询贸易数据
 */
export async function queryTradeData(params: {
  cas: string;
  reporterCode: string;
  startYear: number;
  endYear: number;
}): Promise<TradeDataRecord[]> {
  const db = await getDb(schema);
  const { cas, reporterCode, startYear, endYear } = params;

  const results = await db
    .select()
    .from(tradeData)
    .where(
      and(
        eq(tradeData.cas, cas),
        eq(tradeData.reporterCode, reporterCode),
        between(tradeData.year, startYear, endYear),
        eq(tradeData.partnerCode, '0') // 全球合计数据
      )
    )
    .orderBy(desc(tradeData.year));

  return results;
}

/**
 * 查询贸易伙伴数据
 * 默认排除 partner_code = '699' (未列明国家)
 */
export async function queryTradePartnerData(params: {
  cas: string;
  reporterCode: string;
  year: number;
  flowCode: 'X' | 'M';
  limit?: number;
  excludeUnspecified?: boolean;
}): Promise<TradeDataRecord[]> {
  const db = await getDb(schema);
  const { cas, reporterCode, year, flowCode, limit = 5, excludeUnspecified = true } = params;

  const conditions = [
    eq(tradeData.cas, cas),
    eq(tradeData.reporterCode, reporterCode),
    eq(tradeData.year, year),
    eq(tradeData.flowCode, flowCode),
    sql`${tradeData.partnerCode} != '0'`, // 排除全球合计
  ];

  // 排除"未列明国家" (code = 699)
  if (excludeUnspecified) {
    conditions.push(sql`${tradeData.partnerCode} != '699'`);
  }

  const results = await db
    .select()
    .from(tradeData)
    .where(and(...conditions))
    .orderBy(desc(tradeData.value))
    .limit(limit);

  return results;
}

/**
 * 检查数据是否存在
 */
export async function checkDataExists(params: {
  cas: string;
  reporterCode: string;
  year: number;
}): Promise<boolean> {
  const db = await getDb(schema);
  const results = await db
    .select({ count: sql<number>`count(*)` })
    .from(tradeData)
    .where(
      and(
        eq(tradeData.cas, params.cas),
        eq(tradeData.reporterCode, params.reporterCode),
        eq(tradeData.year, params.year)
      )
    );

  return Number(results[0]?.count) > 0;
}

/**
 * 获取可用年份列表
 */
export async function getAvailableYears(params: {
  cas: string;
  reporterCode: string;
}): Promise<number[]> {
  const db = await getDb(schema);
  const results = await db
    .selectDistinct({ year: tradeData.year })
    .from(tradeData)
    .where(
      and(
        eq(tradeData.cas, params.cas),
        eq(tradeData.reporterCode, params.reporterCode)
      )
    )
    .orderBy(desc(tradeData.year));

  return results.map((r: { year: number }) => r.year);
}

/**
 * 批量插入或更新贸易数据
 */
export async function upsertTradeData(records: TradeDataInsert[]): Promise<void> {
  const db = await getDb(schema);
  for (const record of records) {
    await db
      .insert(tradeData)
      .values(record)
      .onConflictDoUpdate({
        target: [tradeData.cas, tradeData.reporterCode, tradeData.partnerCode, tradeData.year, tradeData.flowCode],
        set: {
          value: record.value,
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          rawData: record.rawData,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

/**
 * 创建同步任务
 */
export async function createSyncTask(params: {
  casList: string[];
  reporterCodes: string[];
  yearRange: { start: number; end: number };
  triggeredBy: string;
}): Promise<string> {
  const db = await getDb(schema);
  const [task] = await db
    .insert(tradeDataSyncTasks)
    .values({
      casList: params.casList,
      reporterCodes: params.reporterCodes,
      yearRange: params.yearRange,
      triggeredBy: params.triggeredBy,
      status: 'pending',
    })
    .returning({ id: tradeDataSyncTasks.id });

  return task.id;
}

/**
 * 获取同步任务状态
 */
export async function getSyncTask(taskId: string): Promise<SyncTaskRecord | undefined> {
  const db = await getDb(schema);
  const results = await db
    .select()
    .from(tradeDataSyncTasks)
    .where(eq(tradeDataSyncTasks.id, taskId));

  return results[0];
}

/**
 * 更新同步任务状态
 */
export async function updateSyncTask(
  taskId: string,
  updates: Partial<SyncTaskInsert>
): Promise<void> {
  const db = await getDb(schema);
  await db
    .update(tradeDataSyncTasks)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tradeDataSyncTasks.id, taskId));
}

/**
 * 获取待处理的同步任务
 */
export async function getPendingSyncTasks(): Promise<SyncTaskRecord[]> {
  const db = await getDb(schema);
  const results = await db
    .select()
    .from(tradeDataSyncTasks)
    .where(eq(tradeDataSyncTasks.status, 'pending'))
    .orderBy(tradeDataSyncTasks.createdAt);

  return results;
}

/**
 * 格式化贸易数据为前端展示格式
 */
export function formatTradeDataForDisplay(
  records: TradeDataRecord[],
  locale: 'zh' | 'en' = 'zh'
): {
  yearlyData: Array<{
    year: number;
    export: { value: number; formatted: string; quantity: string | null };
    import: { value: number; formatted: string; quantity: string | null };
    tradeBalance: { value: number; type: 'surplus' | 'deficit' | 'balanced' };
  }>;
  latestYear: number;
  latestData: {
    export: TradeDataRecord | null;
    import: TradeDataRecord | null;
  };
} {
  // 按年份分组
  const yearMap = new Map<number, { export: TradeDataRecord | null; import: TradeDataRecord | null }>();

  for (const record of records) {
    const year = record.year;
    if (!yearMap.has(year)) {
      yearMap.set(year, { export: null, import: null });
    }
    const yearData = yearMap.get(year)!;
    if (record.flowCode === 'X') {
      yearData.export = record;
    } else if (record.flowCode === 'M') {
      yearData.import = record;
    }
  }

  // 转换为数组并排序
  const yearlyData = Array.from(yearMap.entries())
    .filter(([_, data]) => data.export || data.import)
    .map(([year, data]) => {
      const exportValue = parseFloat(data.export?.value || '0');
      const importValue = parseFloat(data.import?.value || '0');
      const balance = exportValue - importValue;

      return {
        year,
        export: {
          value: exportValue,
          formatted: formatValue(exportValue),
          quantity: data.export?.quantity || null,
        },
        import: {
          value: importValue,
          formatted: formatValue(importValue),
          quantity: data.import?.quantity || null,
        },
        tradeBalance: {
          value: Math.abs(balance),
          type: balance > 0 ? 'surplus' as const : balance < 0 ? 'deficit' as const : 'balanced' as const,
        },
      };
    })
    .sort((a, b) => b.year - a.year);

  const latestYear = yearlyData[0]?.year || new Date().getFullYear() - 1;
  const latestData = yearMap.get(latestYear) || { export: null, import: null };

  return { yearlyData, latestYear, latestData };
}

/**
 * 格式化金额
 */
function formatValue(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} 十亿美元`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} 百万美元`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} 千美元`;
  }
  return `${value.toFixed(2)} 美元`;
}

export default {
  queryTradeData,
  queryTradePartnerData,
  checkDataExists,
  getAvailableYears,
  upsertTradeData,
  createSyncTask,
  getSyncTask,
  updateSyncTask,
  getPendingSyncTasks,
  formatTradeDataForDisplay,
};
