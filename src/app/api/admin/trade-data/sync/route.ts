import { NextRequest, NextResponse } from 'next/server';
import { 
  createSyncTask, 
  getSyncTask, 
  updateSyncTask,
  getPendingSyncTasks,
  upsertTradeData 
} from '@/storage/database/tradeDataManager';
import { getHSCodeByCAS, getAllCASMappings } from '@/lib/cas-hs-mapping';
import { getCountryName } from '@/lib/country-codes';

// UN Comtrade API 配置
const COMTRADE_API_BASE = 'https://comtradeapi.un.org/data/v1';

// 支持多个 API Key 轮询
const API_KEYS = (process.env.UN_COMTRADE_API_KEYS || process.env.UN_COMTRADE_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

let currentKeyIndex = 0;

function getNextApiKey(): string | null {
  if (API_KEYS.length === 0) return null;
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

/**
 * POST /api/admin/trade-data/sync
 * 创建数据同步任务
 * 
 * 请求体:
 * - casList: string[] - CAS列表（可选，不传则同步全部）
 * - reporterCodes: string[] - 报告国代码列表
 * - yearRange: { start: number; end: number } - 年份范围
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casList, reporterCodes, yearRange } = body;

    // 参数验证
    if (!reporterCodes || !Array.isArray(reporterCodes) || reporterCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'reporterCodes is required' },
        { status: 400 }
      );
    }

    if (!yearRange || !yearRange.start || !yearRange.end) {
      return NextResponse.json(
        { success: false, error: 'yearRange (start, end) is required' },
        { status: 400 }
      );
    }

    if (yearRange.start > yearRange.end) {
      return NextResponse.json(
        { success: false, error: 'start year must be <= end year' },
        { status: 400 }
      );
    }

    // 获取 CAS 列表（如果没有指定，则同步全部有 HS 编码映射的 CAS）
    const targetCasList = casList && casList.length > 0 
      ? casList 
      : getAllCASMappings().map(m => m.cas);

    if (targetCasList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No CAS to sync' },
        { status: 400 }
      );
    }

    // 创建同步任务
    // TODO: 从 session 获取管理员用户 ID
    const adminUserId = 'admin'; // 临时写死
    const taskId = await createSyncTask({
      casList: targetCasList,
      reporterCodes,
      yearRange,
      triggeredBy: adminUserId,
    });

    return NextResponse.json({
      success: true,
      taskId,
      message: `Sync task created with ${targetCasList.length} CAS codes`,
    });
  } catch (error) {
    console.error('Error creating sync task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sync task' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/trade-data/sync
 * 获取同步任务状态
 * 
 * 参数:
 * - taskId: 任务ID（可选，不传则返回待处理任务列表）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const task = await getSyncTask(taskId);
      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, task });
    } else {
      const tasks = await getPendingSyncTasks();
      return NextResponse.json({ success: true, tasks });
    }
  } catch (error) {
    console.error('Error getting sync task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sync task' },
      { status: 500 }
    );
  }
}

/**
 * 执行同步任务（从 UN Comtrade 获取数据并保存到数据库）
 * 
 * 这是一个长时间运行的操作，通常应该作为后台任务执行
 */
async function executeSyncTask(taskId: string) {
  const task = await getSyncTask(taskId);
  if (!task) return;

  try {
    // 更新任务状态为运行中
    await updateSyncTask(taskId, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    const { casList, reporterCodes, yearRange } = task;
    const totalItems = casList.length * reporterCodes.length * (yearRange.end - yearRange.start + 1) * 2; // 2 = 进口+出口
    let processedItems = 0;
    const errors: Array<{ cas: string; error: string }> = [];

    // 遍历所有组合
    for (const cas of casList) {
      const mapping = getHSCodeByCAS(cas);
      if (!mapping) {
        errors.push({ cas, error: 'No HS code mapping found' });
        continue;
      }

      for (const reporterCode of reporterCodes) {
        for (let year = yearRange.start; year <= yearRange.end; year++) {
          // 获取出口数据
          try {
            const exportData = await fetchComtradeData({
              reporterCode,
              hsCode: mapping.hsCode6,
              year,
              flowCode: 'X',
            });
            
            if (exportData && exportData.length > 0) {
              // 保存到数据库
              await saveTradeData(cas, mapping, exportData, 'X', year, reporterCode);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ cas, error: `Export data fetch failed: ${errorMsg}` });
          }
          processedItems++;

          // 获取进口数据
          try {
            const importData = await fetchComtradeData({
              reporterCode,
              hsCode: mapping.hsCode6,
              year,
              flowCode: 'M',
            });
            
            if (importData && importData.length > 0) {
              await saveTradeData(cas, mapping, importData, 'M', year, reporterCode);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ cas, error: `Import data fetch failed: ${errorMsg}` });
          }
          processedItems++;

          // 更新进度
          const progress = Math.round((processedItems / totalItems) * 100);
          await updateSyncTask(taskId, {
            progress,
            processedItems,
            totalItems,
            errorCount: errors.length,
            errorLog: errors.slice(-10), // 只保留最近10条错误
          });

          // 避免 API 速率限制
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 任务完成
    await updateSyncTask(taskId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      progress: 100,
      processedItems,
      totalItems,
      errorCount: errors.length,
      errorLog: errors,
    });

  } catch (error) {
    console.error('Sync task failed:', error);
    await updateSyncTask(taskId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorLog: [{ cas: 'task', error: error instanceof Error ? error.message : 'Unknown error' }],
    });
  }
}

/**
 * 从 UN Comtrade API 获取数据
 */
async function fetchComtradeData(params: {
  reporterCode: string;
  hsCode: string;
  year: number;
  flowCode: 'X' | 'M';
}): Promise<any[]> {
  const apiKey = getNextApiKey();
  if (!apiKey) {
    throw new Error('UN_COMTRADE_API_KEY is not configured');
  }

  const url = new URL(`${COMTRADE_API_BASE}/get/C/A/HS`);
  url.searchParams.set('reporterCode', params.reporterCode);
  url.searchParams.set('period', params.year.toString());
  url.searchParams.set('cmdCode', params.hsCode);
  url.searchParams.set('flowCode', params.flowCode);

  const response = await fetch(url.toString(), {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Comtrade API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * 保存贸易数据到数据库
 */
async function saveTradeData(
  cas: string,
  mapping: { name: string; nameEn: string; hsCode6: string },
  apiData: any[],
  flowCode: string,
  year: number,
  reporterCode: string
) {
  const records = apiData.map(item => ({
    cas,
    hsCode: mapping.hsCode6,
    productName: mapping.name,
    productNameEn: mapping.nameEn,
    reporterCode: item.reporterCode?.toString() || reporterCode,
    reporterName: item.reporterDesc || getCountryName(item.reporterCode?.toString() || reporterCode, 'zh'),
    reporterNameEn: item.reporterDesc || getCountryName(item.reporterCode?.toString() || reporterCode, 'en'),
    partnerCode: item.partnerCode?.toString() || '0',
    partnerName: item.partnerDesc || getCountryName(item.partnerCode?.toString() || '0', 'zh'),
    partnerNameEn: item.partnerDesc || getCountryName(item.partnerCode?.toString() || '0', 'en'),
    year,
    flowCode,
    flowName: flowCode === 'X' ? '出口' : '进口',
    value: item.primaryValue?.toString() || '0',
    quantity: item.altQty?.toString() || null,
    unitPrice: item.altQty && item.primaryValue ? (item.primaryValue / item.altQty).toString() : null,
    rawData: item,
    syncedAt: new Date().toISOString(),
  }));

  if (records.length > 0) {
    await upsertTradeData(records);
  }
}
