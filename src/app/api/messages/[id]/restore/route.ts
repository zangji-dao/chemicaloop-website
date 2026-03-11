import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：从 JWT token 中提取用户 ID
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decodedPayload = JSON.parse(Buffer.from(paddedBase64, 'base64').toString('utf-8'));

    return decodedPayload.userId || decodedPayload.sub || null;
  } catch (error) {
    return null;
  }
}

// 辅助函数：代理请求到后端
async function proxyToBackend(request: NextRequest, userId: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const backendUrl = `http://localhost:3001${url.pathname}${url.search}`;

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
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
