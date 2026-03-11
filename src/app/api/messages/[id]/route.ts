import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

// 辅助函数：代理请求到后端
async function proxyToBackend(request: NextRequest, userId: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const backendUrl = `${API_CONFIG.backendURL}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-User-ID', userId); // 将用户 ID 传递给后端

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    // 检查响应类型
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Messages Proxy] Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json({ error: 'Backend service error' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Messages Proxy] Proxy request failed:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

// GET /api/messages/[id] - 获取消息详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// DELETE /api/messages/[id] - 删除消息
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// PATCH /api/messages/[id] - 更新消息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
