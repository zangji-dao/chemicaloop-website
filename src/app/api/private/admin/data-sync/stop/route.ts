import { NextResponse } from 'next/server';

/**
 * POST /api/data-sync/stop
 * 停止爬虫任务
 */
export async function POST() {
  // 更新全局状态
  if (globalThis.crawlerStatus) {
    globalThis.crawlerStatus.isRunning = false;
    globalThis.crawlerStatus.logs.push(`[${new Date().toLocaleTimeString('zh-CN')}] 任务已手动停止`);
  }
  
  return NextResponse.json({ 
    success: true, 
    message: '爬虫任务已停止' 
  });
}
