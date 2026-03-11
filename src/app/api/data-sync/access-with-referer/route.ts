import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/access-with-referer
 * 带 Referer 头访问海关统计平台
 */
export async function GET() {
  let browser: any = null;
  
  try {
    const { chromium } = await import('playwright');
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Referer': 'http://www.customs.gov.cn/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    // 隐藏自动化特征
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
      (window as any).chrome = { runtime: {} };
    });
    
    const page = await context.newPage();
    
    // 先访问海关官网获取 cookie
    console.log('步骤1: 访问海关官网...');
    await page.goto('http://www.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    
    // 获取 cookies
    const cookies = await context.cookies();
    console.log('获取到的 cookies:', cookies.length, '个');
    
    // 步骤2: 访问统计平台
    console.log('步骤2: 访问统计平台...');
    const response = await page.goto('http://stats.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    console.log('HTTP 状态:', response?.status());
    
    // 等待 JavaScript 执行完成
    await page.waitForTimeout(10000);
    
    // 获取页面信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        html: document.documentElement.innerHTML.substring(0, 5000),
        bodyText: document.body?.innerText || '',
        hasContent: (document.body?.innerText?.length || 0) > 50,
        // 查找关键元素
        hasFilter: document.body?.innerText?.includes('筛选') || false,
        hasQuery: document.body?.innerText?.includes('查询') || false,
        hasImport: document.body?.innerText?.includes('进口') || false,
      };
    });
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      httpStatus: response?.status(),
      cookiesCount: cookies.length,
      title: pageInfo.title,
      currentUrl: pageInfo.url,
      hasContent: pageInfo.hasContent,
      bodyTextPreview: pageInfo.bodyText.substring(0, 2000),
      hasFilter: pageInfo.hasFilter,
      hasQuery: pageInfo.hasQuery,
      hasImport: pageInfo.hasImport,
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
    });
    
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
