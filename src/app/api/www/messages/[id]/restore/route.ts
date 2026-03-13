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
  headers.set('X-User-ID', userId);

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Restore Proxy] Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json({ error: 'Backend service error' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Restore Proxy] Proxy request failed:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

// POST /api/messages/[id]/restore - 恢复已删除的消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
