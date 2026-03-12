import { NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';

/**
 * GET /api/data-sync/search-customs-v2
 * 搜索海关统计数据查询系统
 */
export async function GET() {
  try {
    const config = new Config();
    const client = new SearchClient(config);
    
    // 搜索海关统计数据查询系统
    const response = await client.webSearch(
      'stats.customs.gov.cn 海关统计数据 进出口 查询',
      10,
      true
    );
    
    const results = response.web_items?.map(item => ({
      title: item.title,
      url: item.url,
      snippet: item.snippet,
      siteName: item.site_name,
    })) || [];
    
    return NextResponse.json({
      success: true,
      summary: response.summary,
      results,
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
