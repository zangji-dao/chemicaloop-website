import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/click-stats-query
 * 在海关政务平台上点击"海关统计数据查询"
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
    
    // 监听新页面/新标签页
    const pagePromise = context.waitForEvent('page');
    
    // 访问海关政务服务平台
    console.log('访问海关政务服务平台...');
    await page.goto('https://online.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await page.waitForTimeout(3000);
    
    // 查找并点击"海关统计数据查询"
    console.log('查找并点击海关统计数据查询...');
    
    const clicked = await page.evaluate(() => {
      // 查找所有可能包含"海关统计数据查询"的元素
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        // 检查是否是精确匹配"海关统计数据查询"的元素
        if (text === '海关统计数据查询' || text.includes('海关统计数据查询')) {
          // 尝试获取链接
          const link = el.closest('a') || el.querySelector('a') || el;
          if (link) {
            (link as HTMLElement).click();
            return {
              clicked: true,
              text: text,
              tagName: link.tagName,
              className: link.className,
            };
          }
        }
      }
      return { clicked: false };
    });
    
    console.log('点击结果:', clicked);
    
    // 等待新页面打开或页面跳转
    let newPage: any = null;
    try {
      newPage = await Promise.race([
        pagePromise,
        new Promise(resolve => setTimeout(() => resolve(null), 5000)),
      ]);
    } catch (e) {
      console.log('没有新页面打开');
    }
    
    await page.waitForTimeout(3000);
    
    // 获取当前页面或新页面的信息
    const targetPage = newPage || page;
    
    const title = await targetPage.title();
    const currentUrl = targetPage.url();
    
    // 截图
    const screenshot = await targetPage.screenshot({ fullPage: false });
    
    // 获取页面内容
    const content = await targetPage.evaluate(() => {
      return {
        bodyText: document.body?.innerText?.substring(0, 5000) || '',
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
        buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], div[role="button"]')).map(b => ({
          text: b.textContent?.trim() || (b as HTMLInputElement).value,
          type: (b as HTMLInputElement).type || b.tagName,
          className: b.className,
        })),
        iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({
          src: i.src,
          id: i.id,
          name: i.name,
        })),
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      clicked,
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
