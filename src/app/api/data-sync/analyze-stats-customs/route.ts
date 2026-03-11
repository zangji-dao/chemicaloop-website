import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/analyze-stats-customs
 * 深度分析 stats.customs.gov.cn 入口页面
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
    
    // 直接访问 stats.customs.gov.cn
    console.log('访问 http://stats.customs.gov.cn/...');
    
    const response = await page.goto('http://stats.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    console.log('HTTP 状态:', response?.status());
    
    // 等待更长时间让页面完全加载
    await page.waitForTimeout(8000);
    
    const title = await page.title();
    const currentUrl = page.url();
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    // 获取完整的页面内容
    const pageContent = await page.evaluate(() => {
      return {
        // 完整HTML
        html: document.documentElement.innerHTML,
        // Body文本
        bodyText: document.body?.innerText || '',
        // 所有表单
        forms: Array.from(document.querySelectorAll('form')).map(f => ({
          action: f.action,
          method: f.method,
          id: f.id,
          name: f.name,
          target: f.target,
        })),
        // 所有输入框
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          value: i.value,
          className: i.className,
        })),
        // 所有下拉框
        selects: Array.from(document.querySelectorAll('select')).map(s => ({
          name: s.name,
          id: s.id,
          className: s.className,
          optionCount: s.options.length,
          options: Array.from(s.options).map(o => ({ value: o.value, text: o.text })),
        })),
        // 所有按钮
        buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).map(b => {
          const btn = b as HTMLButtonElement | HTMLInputElement;
          return {
            text: btn.textContent?.trim() || ('value' in btn ? btn.value : ''),
            type: btn.type || btn.tagName,
            className: btn.className,
            onclick: btn.getAttribute('onclick'),
          };
        }),
        // 所有链接
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href,
          onclick: a.getAttribute('onclick'),
        })),
        // iframe
        iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
          src: i.src,
          id: i.id,
          name: i.name,
        })),
        // 查找关键字段
        keywords: (() => {
          const text = document.body?.innerText || '';
          return {
            hasImport: text.includes('进口'),
            hasExport: text.includes('出口'),
            hasHS: text.includes('HS') || text.includes('编码'),
            hasQuery: text.includes('查询'),
            hasDownload: text.includes('导出') || text.includes('下载'),
            hasMonth: text.includes('月'),
            hasYear: text.includes('年'),
            hasPartner: text.includes('伙伴') || text.includes('国家'),
            hasTradeMode: text.includes('贸易方式'),
          };
        })(),
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      httpStatus: response?.status(),
      title,
      currentUrl,
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
      pageContent,
    });
    
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
