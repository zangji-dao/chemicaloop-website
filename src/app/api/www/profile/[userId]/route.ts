import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

/**
 * GET /api/profile/[userId]
 * 获取其他用户的公开资料（包括IM联系方式）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const backendUrl = `${API_CONFIG.backendURL}/api/profile/${userId}`;
    
    // 获取认证头
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    console.log('[Profile Proxy] Fetching:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    console.log('[Profile Proxy] Response status:', response.status);
    console.log('[Profile Proxy] Response data:', JSON.stringify(data, null, 2));
    console.log('[Profile Proxy] data.data exists:', !!data.data);
    console.log('[Profile Proxy] Returning:', data.data ? 'data.data' : 'data');

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 返回 data.data 如果存在，否则返回整个 data
    const returnData = data.data || data;
    console.log('[Profile Proxy] Return data:', JSON.stringify(returnData, null, 2));
    return NextResponse.json(returnData);
  } catch (error) {
    console.error('Profile proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
