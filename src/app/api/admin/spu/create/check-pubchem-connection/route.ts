import { NextRequest, NextResponse } from 'next/server';

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const CONNECTION_TIMEOUT = 15000; // 15秒超时

/**
 * GET /api/admin/spu/create/check-pubchem-connection
 * 检测 PubChem API 是否可达
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 使用和同步 API 相同的方式检测连接
    // 通过 CAS 号获取 CID，这是同步的第一步
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    const response = await fetch(
      `${PUBCHEM_BASE_URL}/compound/name/methanol/cids/JSON`,
      {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        connected: true,
        latency,
        message: 'PubChem API 连接成功',
      });
    } else {
      return NextResponse.json({
        success: true,
        connected: false,
        latency,
        message: `PubChem API 返回状态码: ${response.status}`,
      });
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    // 判断错误类型
    let errorMessage = '连接失败';
    
    if (error?.name === 'AbortError') {
      errorMessage = '连接超时（10秒）';
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'EAI_AGAIN') {
      errorMessage = 'DNS 解析失败，请检查网络';
    } else if (error?.code === 'ECONNREFUSED') {
      errorMessage = '连接被拒绝';
    } else if (error?.code === 'ETIMEDOUT') {
      errorMessage = '连接超时';
    } else if (error?.message?.includes('network')) {
      errorMessage = '网络错误';
    }
    
    console.error('[PubChem Connection Check] Error:', error);
    
    return NextResponse.json({
      success: true,
      connected: false,
      latency,
      message: errorMessage,
      error: error?.message || 'Unknown error',
    });
  }
}
