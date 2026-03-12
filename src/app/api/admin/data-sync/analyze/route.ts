import { NextResponse } from 'next/server';

/**
 * GET /api/data-sync/analyze
 * 分析海关官网页面结构
 */
export async function GET() {
  try {
    const url = 'http://stats.customs.gov.cn/';
    
    // 尝试获取页面内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    
    const html = await response.text();
    
    // 分析页面结构
    const analysis = {
      url: response.url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      contentLength: html.length,
      
      // 查找关键元素
      hasForm: html.includes('<form'),
      hasInput: html.includes('<input'),
      hasSelect: html.includes('<select'),
      hasScript: html.includes('<script'),
      
      // 查找可能的API端点
      apiEndpoints: extractApiEndpoints(html),
      
      // 查找表单action
      formActions: extractFormActions(html),
      
      // 页面标题
      title: extractTitle(html),
      
      // 截取部分HTML用于调试
      htmlPreview: html.substring(0, 3000),
    };
    
    return NextResponse.json(analysis);
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractFormActions(html: string): string[] {
  const actions: string[] = [];
  const regex = /<form[^>]*action=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    actions.push(match[1]);
  }
  return actions;
}

function extractApiEndpoints(html: string): string[] {
  const endpoints: string[] = [];
  
  // 查找常见的 API 模式
  const patterns = [
    /['"]([^'"]*(?:api|ajax|query|search|data)[^'"]*)['"]/gi,
    /url:\s*['"]([^'"]+)['"]/gi,
    /fetch\(['"]([^'"]+)['"]/gi,
    /axios\.[a-z]+\(['"]([^'"]+)['"]/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && !endpoints.includes(match[1])) {
        endpoints.push(match[1]);
      }
    }
  }
  
  return endpoints.slice(0, 20); // 限制数量
}
