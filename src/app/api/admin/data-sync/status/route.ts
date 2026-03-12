import { NextResponse } from 'next/server';

// 引用爬虫状态（与 crawl API 共享）
declare global {
  var crawlerStatus: {
    isRunning: boolean;
    taskId: string;
    progress: number;
    logs: string[];
    error: string;
    abortController: AbortController | null;
    params?: {
      hsCode: string;
      tradeType: 'import' | 'export';
      year: number;
      months?: number[];
      partner?: string;
      customs?: string;
    };
    result?: {
      totalRecords: number;
      dataFile?: string;
    };
  };
}

// 初始化全局状态
if (!globalThis.crawlerStatus) {
  globalThis.crawlerStatus = {
    isRunning: false,
    taskId: '',
    progress: 0,
    logs: [],
    error: '',
    abortController: null,
    params: undefined,
    result: undefined,
  };
}

/**
 * GET /api/data-sync/status
 * 获取爬虫状态
 */
export async function GET() {
  return NextResponse.json({
    status: globalThis.crawlerStatus.isRunning ? 'running' : 
            globalThis.crawlerStatus.error ? 'failed' : 'idle',
    taskId: globalThis.crawlerStatus.taskId,
    progress: globalThis.crawlerStatus.progress,
    logs: globalThis.crawlerStatus.logs.slice(-50), // 最近50条日志
    error: globalThis.crawlerStatus.error,
  });
}
