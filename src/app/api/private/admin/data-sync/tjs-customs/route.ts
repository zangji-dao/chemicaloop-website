import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/tjs-customs
 * 访问海关总署统计分析司网站
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
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // 尝试访问海关总署统计分析司
    const urls = [
      'http://tjs.customs.gov.cn/',
      'http://tjs.customs.gov.cn/tjsyw/index.html',
      'http://tjs.customs.gov.cn/tjsj/index.html',
    ];
    
    const results: any[] = [];
    
    for (const url of urls) {
      try {
        console.log(`访问: ${url}`);
        
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        
        await page.waitForTimeout(5000);
        
        const title = await page.title();
        const currentUrl = page.url();
        
        const screenshot = await page.screenshot({ fullPage: false });
        
        const content = await page.evaluate(() => {
          return {
            bodyText: document.body?.innerText?.substring(0, 3000) || '',
            links: Array.from(document.querySelectorAll('a')).slice(0, 30).map(a => ({
              text: a.textContent?.trim(),
              href: a.href,
            })).filter(l => l.text && l.text.length > 0 && l.text.length < 50),
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
