import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/find-stats-entry
 * 在海关政务平台搜索结果中找到真正的统计数据查询入口
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
    
    // 直接访问搜索结果页面
    console.log('访问搜索结果页面...');
    await page.goto('https://online.customs.gov.cn/search?value=海关统计数据查询', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(3000);
    
    // 获取搜索结果中所有链接
    const searchResults = await page.evaluate(() => {
      const results: any[] = [];
      
      // 查找所有搜索结果项
      document.querySelectorAll('a, [class*="result"], [class*="item"], li, div').forEach(el => {
        const text = el.textContent?.trim() || '';
        const href = (el as HTMLAnchorElement).href || '';
        
        // 只保留包含相关关键词的链接
        if ((text.includes('统计') || text.includes('数据') || text.includes('查询') || text.includes('进出口')) 
            && href && href.length > 0 && !href.includes('search?')
            && text.length < 200 && text.length > 5) {
          results.push({
            text: text.substring(0, 150),
            href,
          });
        }
      });
      
      // 去重
      const seen = new Set();
      return results.filter(r => {
        if (seen.has(r.href)) return false;
        seen.add(r.href);
        return true;
      }).slice(0, 20);
    });
    
    console.log('搜索结果:', searchResults);
    
    // 尝试访问"对外提供海关统计服务"页面
    const statsServiceUrl = searchResults.find((r: { text: string; href: string }) => r.text.includes('对外提供海关统计服务'))?.href;
    
    let statsServiceContent: any = null;
    
    if (statsServiceUrl) {
      console.log('访问对外提供海关统计服务页面:', statsServiceUrl);
      await page.goto(statsServiceUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      await page.waitForTimeout(3000);
      
      statsServiceContent = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        bodyText: document.body?.innerText?.substring(0, 2000) || '',
        links: Array.from(document.querySelectorAll('a')).slice(0, 30).map(a => ({
          text: a.textContent?.trim()?.substring(0, 50),
          href: a.href,
        })).filter(l => l.text && l.href && !l.href.includes('javascript')),
        buttons: Array.from(document.querySelectorAll('button, [role="button"], input[type="button"]')).map(b => ({
          text: b.textContent?.trim()?.substring(0, 50),
        })),
        iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
          src: i.src,
          id: i.id,
        })),
      }));
    }
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      searchResults,
      statsServiceUrl,
      statsServiceContent,
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
