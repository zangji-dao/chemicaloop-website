import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/check-login-required
 * 检查海关政务平台是否需要登录才能访问数据查询
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
    
    // 访问海关政务服务平台首页
    console.log('访问海关政务服务平台...');
    await page.goto('https://online.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(3000);
    
    // 分析页面结构，找到所有服务入口
    const serviceAnalysis = await page.evaluate(() => {
      const analysis: any = {
        loginRequired: false,
        services: [],
        statsLinks: [],
      };
      
      // 查找登录相关元素
      const loginText = document.body?.innerText || '';
      analysis.loginRequired = loginText.includes('登录') && !loginText.includes('已登录');
      
      // 查找所有服务项
      document.querySelectorAll('[class*="service"], [class*="item"], li, a, div').forEach(el => {
        const text = el.textContent?.trim() || '';
        const href = (el as HTMLAnchorElement).href || '';
        const onclick = el.getAttribute('onclick') || '';
        
        // 统计相关服务
        if (text.includes('统计') || text.includes('数据') || text.includes('查询')) {
          if (text.length < 100 && (href || onclick)) {
            analysis.statsLinks.push({
              text: text.substring(0, 80),
              href: href || onclick,
              hasHref: !!href,
              hasOnclick: !!onclick,
            });
          }
        }
      });
      
      // 去重
      analysis.statsLinks = analysis.statsLinks.filter((l: any, i: number, arr: any[]) => 
        arr.findIndex((x: any) => x.text === l.text) === i
      ).slice(0, 20);
      
      return analysis;
    });
    
    console.log('服务分析:', serviceAnalysis);
    
    // 尝试点击"我要查"菜单
    const menuClicked = await page.evaluate(() => {
      // 查找"我要查"菜单
      const menus = document.querySelectorAll('a, div, li, span');
      for (const menu of menus) {
        const text = menu.textContent?.trim() || '';
        if (text === '我要查') {
          (menu as HTMLElement).click();
          return { clicked: true, text };
        }
      }
      return { clicked: false };
    });
    
    console.log('菜单点击:', menuClicked);
    
    await page.waitForTimeout(2000);
    
    // 获取点击后的页面内容
    const afterClickContent = await page.evaluate(() => ({
      url: window.location.href,
      bodyText: document.body?.innerText?.substring(0, 2000) || '',
      queryServices: Array.from(document.querySelectorAll('a, [class*="item"], li, div')).filter(el => {
        const text = el.textContent?.trim() || '';
        return (text.includes('统计') || text.includes('数据')) && text.length < 50;
      }).map(el => ({
        text: el.textContent?.trim()?.substring(0, 50),
        href: (el as HTMLAnchorElement).href,
      })).slice(0, 15),
    }));
    
    // 截图
    const screenshot = await page.screenshot({ fullPage: false });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      serviceAnalysis,
      menuClicked,
      afterClickContent,
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
