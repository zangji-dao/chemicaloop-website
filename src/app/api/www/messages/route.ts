import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

// 辅助函数：代理请求到后端
async function proxyToBackend(request: NextRequest, userId: string): Promise<NextResponse> {
  const url = new URL(request.url);
  // 前端 /api/www/messages/... → 后端 /api/messages/...
  const backendPath = url.pathname.replace('/api/www/', '/api/');
  const backendUrl = `${API_CONFIG.backendURL}${backendPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-User-ID', userId); // 将用户 ID 传递给后端

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy request failed:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

// GET /api/messages - 获取消息列表（代理到后端）
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// POST /api/messages - 创建消息（代理到后端）
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
