import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/analyze-customs
 * 使用 Playwright 分析海关官网页面结构
 */
export async function GET() {
  let browser: any = null;
  
  try {
    // 动态导入 playwright
    const { chromium } = await import('playwright');
    
    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    // 访问海关统计网站
    console.log('访问海关统计网站...');
    await page.goto('http://stats.customs.gov.cn/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 获取页面标题
    const title = await page.title();
    
    // 获取页面URL（可能有重定向）
    const currentUrl = page.url();
    
    // 截图（保存为 base64）
    const screenshot = await page.screenshot({ fullPage: false });
    const screenshotBase64 = screenshot.toString('base64');
    
    // 分析页面元素
    const pageAnalysis = await page.evaluate(() => {
      // 查找所有表单
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        name: form.name,
        inputs: Array.from(form.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
        })),
        selects: Array.from(form.querySelectorAll('select')).map(select => ({
          name: select.name,
          id: select.id,
          options: Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text })),
        })),
      }));
      
      // 查找所有按钮
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).map(btn => ({
        text: btn.textContent?.trim() || (btn as HTMLInputElement).value,
        type: (btn as HTMLInputElement).type || btn.tagName,
        id: btn.id,
        className: btn.className,
      }));
      
      // 查找所有链接
      const links = Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
        text: a.textContent?.trim(),
        href: a.href,
      }));
      
      // 查找所有选择框
      const allSelects = Array.from(document.querySelectorAll('select')).map(select => ({
        name: select.name,
        id: select.id,
        className: select.className,
        optionCount: select.options.length,
      }));
      
      // 查找所有输入框
      const allInputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className,
      }));
      
      // 查找可能的 iframe
      const iframes = Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        name: iframe.name,
      }));
      
      // 获取页面文本内容（前2000字符）
      const bodyText = document.body?.innerText?.substring(0, 2000) || '';
      
      return {
        forms,
        buttons,
        links,
        allSelects,
        allInputs,
        iframes,
        bodyText,
      };
    });
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      title,
      currentUrl,
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      analysis: pageAnalysis,
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
