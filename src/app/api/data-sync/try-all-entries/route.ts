import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/try-all-entries
 * 尝试所有可能的海关统计数据入口
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
    
    // 已知的海关统计数据相关URL
    const urls = [
      // 海关总署统计分析司
      'http://tjs.customs.gov.cn/',
      // 海关统计资料
      'http://tjs.customs.gov.cn/tjsj/tjgb/',
      // 进出口统计
      'http://tjs.customs.gov.cn/tjsj/myjk/',
      // 直接访问统计分析司页面
      'http://customs.gov.cn/customs/ztzl86/tjzl/',
      // 数据查询服务
      'http://43.248.49.97/',
      // 尝试 HTTP
      'http://stats.customs.gov.cn/',
    ];
    
    const results: any[] = [];
    
    for (const url of urls) {
      try {
        console.log(`尝试: ${url}`);
        
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        
        await page.waitForTimeout(3000);
        
        const title = await page.title();
        const currentUrl = page.url();
        const content = await page.evaluate(() => ({
          bodyText: document.body?.innerText?.substring(0, 1500) || '',
          hasQueryForm: document.querySelectorAll('input, select').length > 5,
          links: Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
            text: a.textContent?.trim()?.substring(0, 50),
            href: a.href,
          })).filter(l => l.text && l.text.length > 0),
        }));
        
        // 检查是否包含数据查询相关内容
        const hasStatsContent = content.bodyText.includes('统计') || 
                                content.bodyText.includes('数据') ||
                                content.bodyText.includes('进出口') ||
                                content.bodyText.includes('查询');
        
        results.push({
          url,
          success: true,
          title,
          currentUrl,
          hasStatsContent,
          hasQueryForm: content.hasQueryForm,
          bodyTextPreview: content.bodyText.substring(0, 500),
          relevantLinks: content.links.filter((l: { text?: string; href: string }) => 
            l.text?.includes('查询') || 
            l.text?.includes('数据') || 
            l.text?.includes('统计') ||
            l.text?.includes('导出')
          ),
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
