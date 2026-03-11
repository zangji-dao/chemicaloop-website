import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/direct-stats
 * 直接访问海关统计数据查询（忽略SSL证书问题）
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
        '--ignore-certificate-errors-spki-list',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // 尝试访问海关统计数据查询
    const url = 'https://stats.customs.gov.cn/';
    
    console.log(`访问: ${url}`);
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    // 等待页面加载
    await page.waitForTimeout(8000);
    
    const title = await page.title();
    const currentUrl = page.url();
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    // 获取页面内容
    const content = await page.evaluate(() => {
      return {
        bodyText: document.body?.innerText?.substring(0, 8000) || '',
        html: document.documentElement.innerHTML.substring(0, 10000),
        forms: Array.from(document.querySelectorAll('form')).map(f => ({
          action: f.action,
          method: f.method,
          id: f.id,
          name: f.name,
        })),
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          className: i.className,
        })),
        selects: Array.from(document.querySelectorAll('select')).map(s => ({
          name: s.name,
          id: s.id,
          optionCount: s.options.length,
          options: Array.from(s.options).slice(0, 30).map(o => ({ value: o.value, text: o.text })),
        })),
        buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], div[role="button"], a.btn')).map(b => ({
          text: b.textContent?.trim() || (b as HTMLInputElement).value,
          type: (b as HTMLInputElement).type || b.tagName,
          className: b.className,
        })),
        iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
          src: i.src,
          id: i.id,
          name: i.name,
        })),
        // 查找关键查询元素
        queryElements: (() => {
          const elements: any[] = [];
          const keywords = ['商品', '伙伴', '贸易方式', '收发货', 'HS', '编码', '进口', '出口', '查询', '导出', '年份', '月份', '选择'];
          document.querySelectorAll('div, span, label, th, td, li, p').forEach(el => {
            const text = el.textContent?.trim() || '';
            if (keywords.some(kw => text.includes(kw)) && text.length < 100 && text.length > 0) {
              elements.push({
                tag: el.tagName,
                text: text.substring(0, 100),
                className: el.className,
              });
            }
          });
          return elements.slice(0, 50);
        })(),
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      title,
      currentUrl,
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
      content,
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
