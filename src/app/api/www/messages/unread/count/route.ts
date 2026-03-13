import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/tokenUtils';
import { API_CONFIG } from '@/lib/config';

// 辅助函数：代理请求到后端
async function proxyToBackend(request: NextRequest, userId: string): Promise<NextResponse> {
  const url = new URL(request.url);
  // 前端 /api/www/messages/... → 后端 /api/www/messages/...
  const backendPath = url.pathname;
  const backendUrl = `${API_CONFIG.backendURL}${backendPath}${url.search}`;

  // 只传递必要的 headers
  const allowedHeaders = ['content-type', 'authorization', 'x-user-id'];
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (allowedHeaders.includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });
  headers['X-User-ID'] = userId;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    // 检查响应类型
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // 后端返回了非 JSON 响应（可能是错误页面）
      const text = await response.text();
      console.error('[UnreadCount Proxy] Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json({ 
        error: 'Backend service error',
        countsByFolder: { inbox: 0, sent: 0, archive: 0, trash: 0 }
      }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[UnreadCount Proxy] Proxy request failed:', error);
    // 返回默认值，避免前端崩溃
    return NextResponse.json({ 
      error: 'Failed to proxy request',
      countsByFolder: { inbox: 0, sent: 0, archive: 0, trash: 0 }
    }, { status: 500 });
  }
}

// GET /api/messages/unread/count - 获取未读消息数量（代理到后端）
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
