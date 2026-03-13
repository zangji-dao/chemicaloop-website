import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/tokenUtils';
import { API_CONFIG } from '@/lib/config';

// 辅助函数：代理请求到后端
async function proxyToBackend(request: NextRequest, userId: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const backendUrl = `${API_CONFIG.backendURL}${url.pathname}${url.search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
  };

  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[ContactRequests Proxy] Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json({ error: 'Backend service error', requests: [] }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[ContactRequests Proxy] Proxy request failed:', error);
    return NextResponse.json({ error: 'Failed to proxy request', requests: [] }, { status: 500 });
  }
}

// GET /api/contact-requests
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// POST /api/contact-requests
export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// PATCH /api/contact-requests
export async function PATCH(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}

// DELETE /api/contact-requests
export async function DELETE(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return proxyToBackend(request, userId);
}
