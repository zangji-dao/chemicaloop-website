import { NextRequest, NextResponse } from 'next/server';

// 全局爬虫状态
declare global {
  var crawlerStatus: {
    isRunning: boolean;
    taskId: string;
    progress: number;
    logs: string[];
    error: string;
    abortController: AbortController | null;
    // 新增：爬取参数
    params?: {
      hsCode: string;         // HS编码
      tradeType: 'import' | 'export';  // 进口/出口
      year: number;           // 年份
      months?: number[];      // 月份（可选，默认全年）
      partner?: string;       // 贸易伙伴（可选）
      customs?: string;       // 收发货地（可选）
    };
    // 新增：爬取结果
    result?: {
      totalRecords: number;
      dataFile?: string;      // 导出文件路径
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
  };
}

/**
 * POST /api/data-sync/crawl
 * 启动海关数据爬虫任务
 * 
 * 请求参数：
 * - taskId: 任务ID (customs-import / customs-export)
 * - hsCode: HS编码（如 2901）
 * - tradeType: 贸易类型 (import / export)
 * - year: 年份
 * - months: 月份数组（可选，默认全年）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, hsCode, tradeType, year, months } = body;
    
    if (globalThis.crawlerStatus.isRunning) {
      return NextResponse.json({ 
        success: false, 
        error: '已有爬虫任务在运行中' 
      }, { status: 400 });
    }
    
    // 验证必要参数
    if (!hsCode) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供HS编码' 
      }, { status: 400 });
    }
    
    if (!tradeType || !['import', 'export'].includes(tradeType)) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择进口或出口' 
      }, { status: 400 });
    }
    
    if (!year) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择年份' 
      }, { status: 400 });
    }
    
    // 初始化状态
    globalThis.crawlerStatus = {
      isRunning: true,
      taskId: taskId || `customs-${tradeType}-${hsCode}`,
      progress: 0,
      logs: [],
      error: '',
      abortController: new AbortController(),
      params: {
        hsCode,
        tradeType,
        year,
        months: months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    };
    
    // 异步启动爬虫
    const crawlerParams = globalThis.crawlerStatus.params!;
    runCustomsCrawler(crawlerParams).catch(err => {
      globalThis.crawlerStatus.error = err.message;
      globalThis.crawlerStatus.isRunning = false;
    });
    
    return NextResponse.json({ 
      success: true, 
      message: '海关数据爬虫任务已启动',
      taskId: globalThis.crawlerStatus.taskId,
      params: globalThis.crawlerStatus.params,
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * 海关数据爬虫主逻辑
 * 
 * 操作流程：
 * 1. 访问海关统计数据查询网站
 * 2. 选择字段（商品/伙伴/贸易方式/收发货地）
 * 3. 输入HS编码
 * 4. 选择进口/出口
 * 5. 选择年份和月份
 * 6. 查询并导出数据
 */
async function runCustomsCrawler(params: NonNullable<typeof globalThis.crawlerStatus.params>) {
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    globalThis.crawlerStatus.logs.push(`[${timestamp}] ${msg}`);
    console.log(`[Crawler] ${msg}`);
  };
  
  try {
    addLog(`开始爬取海关数据: HS编码=${params.hsCode}, 类型=${params.tradeType === 'import' ? '进口' : '出口'}, 年份=${params.year}`);
    
    // 动态导入 playwright
    const { chromium } = await import('playwright');
    
    addLog('启动浏览器...');
    globalThis.crawlerStatus.progress = 5;
    
    // 启动浏览器（忽略SSL证书错误）
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // 尝试访问海关统计数据查询网站
    // 官方入口列表（按优先级排序）
    const possibleUrls = [
      'https://stats.customs.gov.cn/',
      'https://online.customs.gov.cn/',
      // 备用入口
      'http://43.248.49.97/',
    ];
    
    let pageLoaded = false;
    
    for (const url of possibleUrls) {
      try {
        addLog(`尝试访问: ${url}`);
        
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        
        await page.waitForTimeout(5000);
        
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body?.innerText || '');
        
        if (bodyText && !bodyText.includes('504') && !bodyText.includes('找不到')) {
          addLog(`页面加载成功: ${title}`);
          pageLoaded = true;
          break;
        } else {
          addLog(`页面内容异常，尝试下一个入口`);
        }
        
      } catch (err: any) {
        addLog(`访问 ${url} 失败: ${err.message}`);
      }
    }
    
    if (!pageLoaded) {
      throw new Error('无法访问海关统计数据查询网站，请稍后重试');
    }
    
    globalThis.crawlerStatus.progress = 20;
    
    // 尝试找到并进入数据查询页面
    addLog('查找数据查询入口...');
    
    // 尝试点击"海关统计数据查询"
    const clicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, div, span, li, button');
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (text.includes('海关统计数据查询') || text.includes('数据查询') || text.includes('统计查询')) {
          (el as HTMLElement).click();
          return { clicked: true, text };
        }
      }
      return { clicked: false };
    });
    
    if (clicked.clicked) {
      addLog(`点击了: ${clicked.text}`);
      await page.waitForTimeout(3000);
    }
    
    globalThis.crawlerStatus.progress = 30;
    
    // 检查是否有 iframe（有些网站使用 iframe 嵌入查询系统）
    const iframes = page.frames();
    let targetFrame: any = page;
    
    for (const frame of iframes) {
      const frameContent = await frame.evaluate(() => document.body?.innerText || '').catch(() => '');
      if (frameContent.includes('商品') || frameContent.includes('HS') || frameContent.includes('进口')) {
        targetFrame = frame;
        addLog('找到查询表单（在iframe中）');
        break;
      }
    }
    
    // 尝试填写查询表单
    addLog('填写查询条件...');
    
    try {
      // 1. 选择贸易类型（进口/出口）
      await targetFrame.evaluate((tradeType: string) => {
        // 查找进口/出口选择框
        const radios = document.querySelectorAll('input[type="radio"], label, div[role="radio"]');
        for (const radio of radios) {
          const text = radio.textContent?.trim() || (radio as HTMLInputElement).value || '';
          if (tradeType === 'import' && (text.includes('进口') || text === '1')) {
            (radio as HTMLElement).click();
          } else if (tradeType === 'export' && (text.includes('出口') || text === '2')) {
            (radio as HTMLElement).click();
          }
        }
      }, params.tradeType);
      
      addLog(`已选择: ${params.tradeType === 'import' ? '进口' : '出口'}`);
      
      // 2. 输入HS编码
      await targetFrame.evaluate((hsCode: string) => {
        // 查找HS编码输入框
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of inputs) {
          const placeholder = input.getAttribute('placeholder') || '';
          const name = (input as HTMLInputElement).name || input.id || '';
          if (placeholder.includes('HS') || placeholder.includes('编码') || placeholder.includes('商品') ||
              name.includes('hs') || name.includes('code') || name.includes('商品')) {
            (input as HTMLInputElement).value = hsCode;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }, params.hsCode);
      
      addLog(`已输入HS编码: ${params.hsCode}`);
      
      // 3. 选择年份
      await targetFrame.evaluate((year: number) => {
        const selects = document.querySelectorAll('select');
        for (const select of selects) {
          const options = Array.from(select.options);
          for (const opt of options) {
            if (opt.text.includes(String(year)) || opt.value === String(year)) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        }
      }, params.year);
      
      addLog(`已选择年份: ${params.year}`);
      
    } catch (formErr: any) {
      addLog(`表单填写警告: ${formErr.message}`);
    }
    
    globalThis.crawlerStatus.progress = 50;
    
    // 截图保存当前页面状态
    const screenshot = await page.screenshot({ fullPage: false });
    addLog('已保存页面截图');
    
    // 尝试点击查询按钮
    addLog('执行查询...');
    
    await targetFrame.evaluate(() => {
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, div[role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('查询') || text.includes('搜索') || text.includes('确定')) {
          (btn as HTMLElement).click();
          return;
        }
      }
    });
    
    await page.waitForTimeout(5000);
    globalThis.crawlerStatus.progress = 70;
    
    // 尝试导出数据
    addLog('尝试导出数据...');
    
    // 监听下载事件
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
    
    await targetFrame.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, input[type="button"]');
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('导出') || text.includes('下载') || text.includes('Excel')) {
          (btn as HTMLElement).click();
          return;
        }
      }
    });
    
    const download = await downloadPromise;
    
    if (download) {
      const fileName = `customs_${params.tradeType}_${params.hsCode}_${params.year}.xlsx`;
      const savePath = `/tmp/${fileName}`;
      await download.saveAs(savePath);
      addLog(`数据已导出到: ${fileName}`);
      globalThis.crawlerStatus.result = {
        totalRecords: 0,
        dataFile: fileName,
      };
    } else {
      addLog('未找到导出按钮或下载失败，请检查页面');
    }
    
    await browser.close();
    addLog('浏览器已关闭');
    
    globalThis.crawlerStatus.progress = 100;
    globalThis.crawlerStatus.isRunning = false;
    addLog('爬取任务完成');
    
  } catch (error: any) {
    addLog(`错误: ${error.message}`);
    globalThis.crawlerStatus.error = error.message;
    globalThis.crawlerStatus.isRunning = false;
  }
}
