import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/analyze-customs-v2
 * 分析海关统计数据的实际查询入口
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
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
    });
    
    const page = await context.newPage();
    
    // 尝试多个可能的海关数据查询入口
    const urls = [
      'http://stats.customs.gov.cn/',
      'http://stats.customs.gov.cn/index.html',
      'http://43.248.49.97/',
      'http://43.248.49.97/index.html',
    ];
    
    const results: any[] = [];
    
    for (const url of urls) {
      try {
        console.log(`尝试访问: ${url}`);
        
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        
        // 等待更长时间让 JS 执行
        await page.waitForTimeout(5000);
        
        const title = await page.title();
        const currentUrl = page.url();
        
        // 截图
        const screenshot = await page.screenshot({ fullPage: false });
        
        // 获取页面内容
        const content = await page.evaluate(() => {
          return {
            html: document.documentElement.innerHTML.substring(0, 5000),
            bodyText: document.body?.innerText?.substring(0, 2000) || '',
            forms: Array.from(document.querySelectorAll('form')).map(f => ({
              action: f.action,
              method: f.method,
              id: f.id,
            })),
            inputs: Array.from(document.querySelectorAll('input')).map(i => ({
              type: i.type,
              name: i.name,
              id: i.id,
              placeholder: i.placeholder,
            })),
            selects: Array.from(document.querySelectorAll('select')).map(s => ({
              name: s.name,
              id: s.id,
              optionCount: s.options.length,
            })),
            buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).map(b => ({
              text: b.textContent?.trim() || (b as HTMLInputElement).value,
              type: (b as HTMLInputElement).type || b.tagName,
            })),
            iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
              src: i.src,
              id: i.id,
            })),
          };
        });
        
        results.push({
          url,
          success: true,
          title,
          currentUrl,
          screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
          content,
        });
        
      } catch (err: any) {
        results.push({
          url,
          success: false,
          error: err.message,
        });
      }
    }
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      results,
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
