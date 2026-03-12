import { NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';

/**
 * GET /api/data-sync/search-data-query
 * 搜索海关统计数据查询的具体入口
 */
export async function GET() {
  try {
    const config = new Config();
    const client = new SearchClient(config);
    
    // 多种搜索查询
    const queries = [
      '海关统计数据查询系统 商品 伙伴 贸易方式',
      '中国海关进出口数据查询 导出 HS编码',
      'customs.gov.cn 数据查询 入口',
    ];
    
    const allResults: any[] = [];
    
    for (const query of queries) {
      const response = await client.webSearch(query, 5, false);
      
      if (response.web_items) {
        for (const item of response.web_items) {
          // 过滤掉重复的结果
          if (!allResults.find(r => r.url === item.url)) {
            allResults.push({
              title: item.title,
              url: item.url,
              snippet: item.snippet,
              siteName: item.site_name,
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      results: allResults,
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
