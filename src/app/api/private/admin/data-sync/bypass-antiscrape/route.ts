import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/bypass-antiscrape
 * 尝试绕过海关网站的反爬虫保护
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
      ],
    });
    
    // 创建更真实的浏览器环境
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      ignoreHTTPSErrors: true,
      // 添加更多真实浏览器特征
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });
    
    const page = await context.newPage();
    
    // 隐藏自动化特征
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
      (window as any).chrome = { runtime: {} };
    });
    
    console.log('访问 http://stats.customs.gov.cn/...');
    
    // 先访问一个页面建立会话
    await page.goto('http://www.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    
    // 然后访问统计页面
    const response = await page.goto('http://stats.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    console.log('HTTP 状态:', response?.status());
    
    // 等待 JavaScript 执行
    await page.waitForTimeout(10000);
    
    const title = await page.title();
    const currentUrl = page.url();
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    // 获取页面内容
    const content = await page.evaluate(() => {
      return {
        html: document.documentElement.innerHTML.substring(0, 10000),
        bodyText: document.body?.innerText || '',
        hasContent: (document.body?.innerText?.length || 0) > 100,
        forms: Array.from(document.querySelectorAll('form')).length,
        inputs: Array.from(document.querySelectorAll('input')).length,
        selects: Array.from(document.querySelectorAll('select')).length,
        buttons: Array.from(document.querySelectorAll('button')).length,
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      httpStatus: response?.status(),
      title,
      currentUrl,
      hasContent: content.hasContent,
      bodyTextPreview: content.bodyText.substring(0, 2000),
      formsCount: content.forms,
      inputsCount: content.inputs,
      selectsCount: content.selects,
      buttonsCount: content.buttons,
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
