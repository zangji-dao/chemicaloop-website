import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/access-stats-platform
 * 尝试访问海关统计数据在线查询平台
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
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      ignoreHTTPSErrors: true,
    });
    
    // 隐藏自动化特征
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    const page = await context.newPage();
    
    // 方法1: 尝试从海关官网跳转
    console.log('方法1: 从海关官网跳转...');
    await page.goto('http://www.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    
    // 查找统计相关链接
    const statsLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const text = link.textContent?.trim() || '';
        const href = link.href || '';
        if (text.includes('统计') || href.includes('stats')) {
          return { text, href };
        }
      }
      return null;
    });
    
    console.log('找到的统计链接:', statsLink);
    
    // 方法2: 直接访问统计页面（HTTP）
    console.log('方法2: 直接访问 HTTP...');
    await page.goto('http://stats.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(8000);
    
    const title = await page.title();
    const currentUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    // 分析页面元素
    const pageAnalysis = await page.evaluate(() => {
      return {
        // 进出口类型
        importExportOptions: Array.from(document.querySelectorAll('input[type="radio"]')).map(r => {
          const input = r as HTMLInputElement;
          return {
            name: input.name,
            value: input.value,
            checked: input.checked,
            nextText: r.nextElementSibling?.textContent?.trim(),
          };
        }),
        // 下拉框
        selects: Array.from(document.querySelectorAll('select')).map(s => {
          const select = s as HTMLSelectElement;
          return {
            name: select.name,
            id: select.id,
            className: select.className,
            value: select.value,
            options: Array.from(select.options).slice(0, 15).map(o => ({ value: o.value, text: o.text })),
          };
        }),
        // 输入框
        inputs: Array.from(document.querySelectorAll('input[type="text"], input:not([type])')).map(i => {
          const input = i as HTMLInputElement;
          return {
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className,
          };
        }),
        // 按钮
        buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).map(b => {
          const btn = b as HTMLButtonElement | HTMLInputElement;
          return {
            text: btn.textContent?.trim() || ('value' in btn ? btn.value : ''),
            type: btn.type,
            className: btn.className,
          };
        }),
        // 查找"筛选条件设置"
        hasFilterSection: document.body?.innerText?.includes('筛选条件设置') || false,
        // 查找"输出字段"
        hasOutputFields: document.body?.innerText?.includes('输出字段') || false,
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      method: 'direct_http',
      title,
      currentUrl,
      bodyTextPreview: bodyText.substring(0, 1500),
      statsLink,
      pageAnalysis,
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
