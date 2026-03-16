import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { withAdminAuth } from '@/lib/withAuth';

const execAsync = promisify(exec);

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const CONNECTION_TIMEOUT = 15000; // 15秒超时

/**
 * 使用 curl 作为备用方案（解决 Node.js fetch 网络限制）
 */
async function fetchWithCurl(url: string, timeoutMs: number = 15000): Promise<{ ok: boolean; json?: () => Promise<any> } | null> {
  try {
    const timeoutSeconds = Math.floor(timeoutMs / 1000);
    const tempFile = `/tmp/pubchem_check_${Date.now()}.json`;
    const command = `curl -s --connect-timeout 10 --max-time ${timeoutSeconds} '${url}' -o ${tempFile}`;
    
    await execAsync(command, { timeout: timeoutMs + 5000 });
    
    if (existsSync(tempFile)) {
      const content = readFileSync(tempFile, 'utf-8');
      unlinkSync(tempFile);
      
      if (content && content.trim()) {
        try {
          const result = JSON.parse(content);
          return { ok: true, json: () => Promise.resolve(result) };
        } catch {
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('[PubChem] Curl check error:', error);
    return null;
  }
}

/**
 * GET /api/admin/spu/create/check-pubchem-connection
 * 检测 PubChem API 是否可达
 */
export const GET = withAdminAuth(async (request) => {
  const startTime = Date.now();
  const url = `${PUBCHEM_BASE_URL}/compound/name/methanol/cids/JSON`;
  
  try {
    // 首先尝试直接 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
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
    // 直接 fetch 失败，尝试 curl 备用方案
    console.log('[PubChem Connection] Fetch failed, trying curl fallback...');
    
    try {
      const curlResponse = await fetchWithCurl(url, CONNECTION_TIMEOUT);
      const latency = Date.now() - startTime;
      
      if (curlResponse && curlResponse.ok) {
        return NextResponse.json({
          success: true,
          connected: true,
          latency,
          message: 'PubChem API 连接成功 (via curl)',
        });
      }
    } catch (curlError) {
      console.error('[PubChem Connection] Curl fallback also failed:', curlError);
    }
    
    const latency = Date.now() - startTime;
    
    // 判断错误类型
    let errorMessage = '连接失败';
    
    if (error?.name === 'AbortError') {
      errorMessage = '连接超时（15秒）';
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
});
