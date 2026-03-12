import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/deep-analyze
 * 深度分析海关政务平台的数据查询入口
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
    
    // 监听所有页面事件
    const pages: any[] = [];
    context.on('page', (page: any) => {
      pages.push(page);
    });
    
    const page = await context.newPage();
    
    // 访问海关政务服务平台
    console.log('访问海关政务服务平台...');
    await page.goto('https://online.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(3000);
    
    // 获取所有包含"统计"或"数据"的链接和元素
    const statsElements = await page.evaluate(() => {
      const results: any[] = [];
      
      // 查找所有可能的链接和可点击元素
      document.querySelectorAll('a, div[onclick], span[onclick], li, button, [class*="item"], [class*="menu"]').forEach(el => {
        const text = el.textContent?.trim() || '';
        const onclick = el.getAttribute('onclick') || '';
        const href = (el as HTMLAnchorElement).href || '';
        const className = el.className || '';
        const id = el.id || '';
        
        if (text.includes('统计') || text.includes('数据查询') || text.includes('海关统计') || 
            href.includes('stats') || href.includes('tjs') || href.includes('data')) {
          results.push({
            tag: el.tagName,
            text: text.substring(0, 100),
            href,
            onclick,
            className: className.substring(0, 100),
            id,
          });
        }
      });
      
      return results;
    });
    
    console.log('找到的统计相关元素:', statsElements);
    
    // 尝试点击"海关统计数据查询"
    const clicked = await page.evaluate(() => {
      // 查找精确包含"海关统计数据查询"的元素
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (text === '海关统计数据查询') {
          // 找到父级可点击元素
          const clickable = el.closest('a, [onclick], [role="button"], button') || el;
          (clickable as HTMLElement).click();
          return { clicked: true, text, tag: clickable.tagName };
        }
      }
      
      // 如果精确匹配失败，尝试模糊匹配
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (text.includes('海关统计') && text.includes('查询')) {
          const clickable = el.closest('a, [onclick], [role="button"], button') || el;
          (clickable as HTMLElement).click();
          return { clicked: true, text: text.substring(0, 50), tag: clickable.tagName };
        }
      }
      
      return { clicked: false };
    });
    
    console.log('点击结果:', clicked);
    
    // 等待新页面或页面跳转
    await page.waitForTimeout(5000);
    
    // 收集所有页面的信息
    const pageInfos: any[] = [];
    
    for (const p of pages.length > 1 ? pages : [page]) {
      try {
        const url = p.url();
        const title = await p.title();
        const content = await p.evaluate(() => ({
          bodyText: document.body?.innerText?.substring(0, 2000) || '',
          hasQueryForm: document.querySelectorAll('form, input, select').length > 0,
          inputs: Array.from(document.querySelectorAll('input')).slice(0, 10).map(i => ({
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
          })),
          selects: Array.from(document.querySelectorAll('select')).slice(0, 5).map(s => ({
            name: s.name,
            optionCount: s.options.length,
          })),
        }));
        
        pageInfos.push({ url, title, content });
      } catch (e: any) {
        pageInfos.push({ error: e.message });
      }
    }
    
    // 如果没有新页面，获取当前页面信息
    if (pageInfos.length === 0) {
      const url = page.url();
      const title = await page.title();
      const content = await page.evaluate(() => ({
        bodyText: document.body?.innerText?.substring(0, 2000) || '',
        hasQueryForm: document.querySelectorAll('form, input, select').length > 0,
      }));
      pageInfos.push({ url, title, content });
    }
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      statsElements,
      clicked,
      pageInfos,
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
