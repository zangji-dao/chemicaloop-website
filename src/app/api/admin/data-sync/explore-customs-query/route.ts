import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/explore-customs-query
 * 探索海关统计数据查询页面
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
    
    // 访问海关政务服务平台
    console.log('访问海关政务服务平台...');
    await page.goto('https://online.customs.gov.cn/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await page.waitForTimeout(3000);
    
    // 查找"海关统计数据查询"链接
    console.log('查找海关统计数据查询链接...');
    
    // 尝试找到包含"海关统计数据查询"的链接
    const statsQueryLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, div[class*="item"], span[class*="item"], li'));
      for (const link of links) {
        if (link.textContent?.includes('海关统计数据查询')) {
          return {
            text: link.textContent?.trim(),
            href: (link as HTMLAnchorElement).href || '',
            tagName: link.tagName,
            className: link.className,
          };
        }
      }
      return null;
    });
    
    console.log('找到链接:', statsQueryLink);
    
    // 尝试点击或直接访问数据查询页面
    let queryPageUrl = '';
    
    if (statsQueryLink?.href) {
      queryPageUrl = statsQueryLink.href;
    } else {
      // 尝试点击包含"海关统计数据查询"的元素
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, div, span, li'));
        for (const el of elements) {
          if (el.textContent?.includes('海关统计数据查询')) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      
      await page.waitForTimeout(3000);
      queryPageUrl = page.url();
    }
    
    // 如果找到了查询页面URL，直接访问
    if (queryPageUrl && queryPageUrl !== 'https://online.customs.gov.cn/') {
      console.log('访问查询页面:', queryPageUrl);
      await page.goto(queryPageUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(5000);
    }
    
    const title = await page.title();
    const currentUrl = page.url();
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    // 获取页面内容
    const content = await page.evaluate(() => {
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
          options: Array.from(s.options).slice(0, 20).map(o => ({ value: o.value, text: o.text })),
        })),
        buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a.button')).map(b => ({
          text: b.textContent?.trim() || (b as HTMLInputElement).value,
          type: (b as HTMLInputElement).type || b.tagName,
          className: b.className,
        })),
        links: Array.from(document.querySelectorAll('a')).slice(0, 50).map(a => ({
          text: a.textContent?.trim(),
          href: a.href,
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
      statsQueryLink,
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
