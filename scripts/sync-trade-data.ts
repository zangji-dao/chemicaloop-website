/**
 * UN Comtrade 贸易数据同步脚本
 * 
 * 从 UN Comtrade API 获取贸易数据并存入本地数据库
 * 
 * 使用方式:
 * UN_COMTRADE_API_KEY=xxx npx tsx scripts/sync-trade-data.ts --cas 148-24-3 --years 2020-2025
 */

import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '../src/storage/database/shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getHSCodeByCAS } from '../src/lib/cas-hs-mapping';
import { REPORTER_COUNTRIES, getCountryName } from '../src/lib/country-codes';

// UN Comtrade API 配置
const UN_COMTRADE_API_BASE = 'https://comtradeapi.un.org/data/v1';
const UN_COMTRADE_API_KEY = process.env.UN_COMTRADE_API_KEY || '';

// 请求间隔（毫秒）- 避免触发 API 限流
// 免费版限制：每小时 100 次请求 = 每 36 秒 1 次
// 我们设置为 2 秒间隔，遇到 429 时动态等待
const REQUEST_DELAY = 2000;

// UN Comtrade API 响应格式
interface TradeDataResponse {
  elapsedTime?: string;
  count?: number;
  data?: Array<{
    typeCode: string;       // 流向代码: X=出口, M=进口
    freqCode: string;
    refPeriodId: number;
    refYear: number;
    refMonth: number;
    period: string;
    reporterCode: number;   // 报告国代码 (数字)
    reporterISO: string | null;
    reporterDesc: string | null;
    flowCode: string;       // 流向代码
    flowDesc: string | null;
    partnerCode: number;    // 贸易伙伴代码 (数字, 0=World)
    partnerISO: string | null;
    partnerDesc: string | null;
    partner2Code: number;
    partner2ISO: string | null;
    partner2Desc: string | null;
    classificationCode: string;
    classificationSearchCode: string;
    isOriginalClassification: boolean;
    cmdCode: string;        // HS 编码
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
    qty: number | null;     // 数量
    isQtyEstimated: boolean;
    altQtyUnitCode: number;
    altQtyUnitAbbr: string | null;
    altQty: number | null;
    isAltQtyEstimated: boolean;
    netWgt: number | null;  // 净重
    isNetWgtEstimated: boolean;
    grossWgt: number | null;
    isGrossWgtEstimated: boolean;
    cifvalue: number | null;
    fobvalue: number | null;
    primaryValue: number;   // 主要价值 (美元)
    legacyEstimationFlag: number;
    isReported: boolean;
    isAggregate: boolean;
  }>;
  error?: string;
}

interface SyncProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ reporterCode: string; year: number; error: string }>;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 从 UN Comtrade API 获取贸易数据
 * 
 * 不传 partnerCode 参数，API 会返回所有贸易伙伴数据（包括 partnerCode=0 的全球合计）
 */
async function fetchTradeData(params: {
  reporterCode: string;
  hsCode: string;
  year: number;
}, maxRetries: number = 3): Promise<TradeDataResponse | null> {
  const { reporterCode, hsCode, year } = params;

  // 分别获取出口和进口数据
  const allData: TradeDataResponse['data'] = [];
  
  for (const flowCode of ['X', 'M'] as const) {
    let retries = 0;
    
    while (retries < maxRetries) {
      // 构建 API URL
      // 参考: https://comtradeapi.un.org/swagger/
      // 正确格式: /data/v1/get/C/{freq}/HS
      const url = new URL(`${UN_COMTRADE_API_BASE}/get/C/A/HS`);
      
      // 添加查询参数
      url.searchParams.set('reporterCode', reporterCode);
      url.searchParams.set('period', year.toString());
      url.searchParams.set('cmdCode', hsCode);
      url.searchParams.set('flowCode', flowCode);
      // 不传 partnerCode，API 会返回所有贸易伙伴数据

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': UN_COMTRADE_API_KEY,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // 处理速率限制 (429)
          if (response.status === 429) {
            const waitMatch = errorText.match(/Try again in (\d+) seconds?/i);
            const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) + 1 : 5;
            console.log(`  速率限制，等待 ${waitSeconds} 秒后重试...`);
            await delay(waitSeconds * 1000);
            retries++;
            continue;
          }
          
          console.error(`API Error (${response.status}): ${errorText}`);
          break;
        }

        const data: TradeDataResponse = await response.json();
        if (data.data) {
          allData.push(...data.data);
        }
        break; // 成功，跳出重试循环
      } catch (error) {
        console.error(`Network error for ${flowCode}: ${error}`);
        retries++;
        if (retries < maxRetries) {
          await delay(2000);
        }
      }
    }
  }

  return { count: allData.length, data: allData };
}

/**
 * 将 API 数据转换为数据库记录格式
 */
function transformData(
  apiData: TradeDataResponse,
  cas: string,
  hsCode: string,
  productName: string,
  productNameEn: string,
  reporterCode: string,
  year: number
): Array<typeof schema.tradeData.$inferInsert> {
  const records: Array<typeof schema.tradeData.$inferInsert> = [];

  if (!apiData.data || apiData.data.length === 0) {
    return records;
  }

  for (const item of apiData.data) {
    // flowCode: X = Export, M = Import (使用 flowCode 或 typeCode)
    const flowCode = item.flowCode || item.typeCode;
    if (flowCode !== 'X' && flowCode !== 'M') continue;

    // 计算单价 (使用 qty 或 netWgt，API 返回单位是 kg)
    // 单价单位: 美元/吨
    const qtyKg = item.qty || item.netWgt;
    let unitPrice = null;
    if (qtyKg && qtyKg > 0 && item.primaryValue > 0) {
      // 转换为美元/吨: (金额 / 千克) * 1000 = 美元/吨
      unitPrice = (item.primaryValue * 1000 / qtyKg).toFixed(2);
    }

    // 处理 partnerCode (API 返回的是数字，需要转为字符串)
    const partnerCode = String(item.partnerCode ?? 0);
    
    // 获取国家名称
    const partnerNameZ = getCountryName(partnerCode, 'zh');
    const partnerNameEn = getCountryName(partnerCode, 'en');
    const reporterNameZ = getCountryName(reporterCode, 'zh');
    const reporterNameEn = getCountryName(reporterCode, 'en');

    records.push({
      cas,
      hsCode,
      productName,
      productNameEn,
      reporterCode,
      reporterName: item.reporterDesc || reporterNameZ || reporterCode,
      reporterNameEn: item.reporterDesc || reporterNameEn || reporterCode,
      partnerCode,
      partnerName: partnerCode === '0' ? 'World' : (item.partnerDesc || partnerNameZ || partnerCode),
      partnerNameEn: partnerCode === '0' ? 'World' : (item.partnerDesc || partnerNameEn || partnerCode),
      year,
      flowCode,
      flowName: flowCode === 'X' ? 'Export' : 'Import',
      value: item.primaryValue?.toString() || '0',
      quantity: qtyKg?.toString() || null,
      unitPrice,
      rawData: item,
    });
  }

  return records;
}

/**
 * 检查数据库中是否已有数据
 */
async function checkExistingData(
  db: Awaited<ReturnType<typeof getDb>>,
  cas: string,
  reporterCode: string,
  year: number
): Promise<boolean> {
  const results = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tradeData)
    .where(
      and(
        eq(schema.tradeData.cas, cas),
        eq(schema.tradeData.reporterCode, reporterCode),
        eq(schema.tradeData.year, year)
      )
    );

  return Number(results[0]?.count) > 0;
}

/**
 * 保存贸易数据到数据库
 */
async function saveTradeData(
  records: Array<typeof schema.tradeData.$inferInsert>
): Promise<void> {
  const db = await getDb(schema);

  for (const record of records) {
    await db
      .insert(schema.tradeData)
      .values(record)
      .onConflictDoUpdate({
        target: [
          schema.tradeData.cas,
          schema.tradeData.reporterCode,
          schema.tradeData.partnerCode,
          schema.tradeData.year,
          schema.tradeData.flowCode,
        ],
        set: {
          value: record.value,
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          rawData: record.rawData,
        },
      });
  }
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const params: {
    cas: string | null;
    startYear: number;
    endYear: number;
    topCountries: number;
    dryRun: boolean;
    force: boolean;
  } = {
    cas: null,
    startYear: 2020,
    endYear: 2025,
    topCountries: 50,
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--cas') {
      params.cas = args[++i];
    } else if (arg === '--years') {
      const years = args[++i].split('-').map(Number);
      params.startYear = years[0];
      params.endYear = years[1] || years[0];
    } else if (arg === '--top') {
      params.topCountries = parseInt(args[++i], 10);
    } else if (arg === '--dry-run') {
      params.dryRun = true;
    } else if (arg === '--force') {
      params.force = true;
    }
  }

  return params;
}

/**
 * 主函数
 */
async function main() {
  const params = parseArgs();

  console.log('='.repeat(60));
  console.log('UN Comtrade 贸易数据同步');
  console.log('='.repeat(60));

  // 验证 CAS 号
  if (!params.cas) {
    console.error('错误: 请提供 CAS 号，例如 --cas 148-24-3');
    process.exit(1);
  }

  // 获取 HS 编码映射
  const mapping = getHSCodeByCAS(params.cas);
  if (!mapping) {
    console.error(`错误: 未找到 CAS ${params.cas} 的 HS 编码映射`);
    process.exit(1);
  }

  console.log(`\n产品信息:`);
  console.log(`  CAS: ${params.cas}`);
  console.log(`  名称: ${mapping.name} / ${mapping.nameEn}`);
  console.log(`  HS编码: ${mapping.hsCode6}`);
  console.log(`\n同步范围:`);
  console.log(`  年份: ${params.startYear}-${params.endYear}`);
  console.log(`  国家数量: 前 ${params.topCountries} 个主要贸易国`);
  console.log(`  模式: ${params.dryRun ? '试运行 (不写入数据库)' : '正式运行'}`);
  console.log(`  强制覆盖: ${params.force ? '是' : '否'}`);

  // 检查 API Key
  if (!UN_COMTRADE_API_KEY) {
    console.error('\n错误: 未设置 UN_COMTRADE_API_KEY 环境变量');
    console.error('请在 .env 文件中添加: UN_COMTRADE_API_KEY=your-api-key');
    process.exit(1);
  }

  // 获取要同步的国家列表
  const countries = REPORTER_COUNTRIES.slice(0, params.topCountries);
  const years = [];
  for (let y = params.startYear; y <= params.endYear; y++) {
    years.push(y);
  }

  // 每次 API 调用需要分别请求出口(X)和进口(M)，所以乘以 2
  const totalRequests = countries.length * years.length * 2;
  console.log(`\n预计调用次数: ${totalRequests} 次 (出口+进口)`);
  console.log(`预计耗时: ${Math.ceil(totalRequests * REQUEST_DELAY / 1000 / 60)} 分钟`);

  // 初始化进度
  const progress: SyncProgress = {
    total: totalRequests,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // 获取数据库连接
  const db = await getDb(schema);

  console.log('\n开始同步...\n');

  // 遍历国家和年份
  for (const country of countries) {
    console.log(`\n[${country.name} (${country.code})]`);

    for (const year of years) {
      progress.processed++;

      // 检查是否已有数据（非强制模式）
      if (!params.force && !params.dryRun) {
        const exists = await checkExistingData(db, params.cas!, country.code, year);
        if (exists) {
          progress.skipped++;
          console.log(`  ${year}: 已存在，跳过`);
          continue;
        }
      }

      // 调用 UN Comtrade API
      console.log(`  ${year}: 正在获取...`);

      if (params.dryRun) {
        // 试运行模式，不实际调用 API
        progress.success++;
        console.log(`  ${year}: [试运行] 模拟成功`);
        continue;
      }

      const apiData = await fetchTradeData({
        reporterCode: country.code,
        hsCode: mapping.hsCode6,
        year,
      });

      if (!apiData) {
        progress.failed++;
        progress.errors.push({
          reporterCode: country.code,
          year,
          error: 'API 请求失败',
        });
        console.log(`  ${year}: ❌ API 请求失败`);
        await delay(REQUEST_DELAY);
        continue;
      }

      // 检查是否有数据
      if (!apiData.data || apiData.data.length === 0) {
        progress.skipped++;
        console.log(`  ${year}: ⚪ 无数据`);
        await delay(REQUEST_DELAY);
        continue;
      }

      // 转换并保存数据
      try {
        const records = transformData(
          apiData,
          params.cas!,
          mapping.hsCode6,
          mapping.name,
          mapping.nameEn,
          country.code,
          year
        );

        if (records.length > 0) {
          await saveTradeData(records);
          progress.success++;
          console.log(`  ${year}: ✅ 已保存 ${records.length} 条记录`);
        } else {
          progress.skipped++;
          console.log(`  ${year}: ⚪ 无有效数据`);
        }
      } catch (error) {
        progress.failed++;
        progress.errors.push({
          reporterCode: country.code,
          year,
          error: String(error),
        });
        console.log(`  ${year}: ❌ 保存失败: ${error}`);
      }

      // 延迟，避免触发限流
      await delay(REQUEST_DELAY);
    }
  }

  // 输出统计
  console.log('\n' + '='.repeat(60));
  console.log('同步完成');
  console.log('='.repeat(60));
  console.log(`总请求数: ${progress.total}`);
  console.log(`成功: ${progress.success}`);
  console.log(`跳过: ${progress.skipped}`);
  console.log(`失败: ${progress.failed}`);

  if (progress.errors.length > 0) {
    console.log('\n错误详情:');
    for (const error of progress.errors.slice(0, 10)) {
      console.log(`  - ${error.reporterCode} (${error.year}): ${error.error}`);
    }
    if (progress.errors.length > 10) {
      console.log(`  ... 还有 ${progress.errors.length - 10} 个错误`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
