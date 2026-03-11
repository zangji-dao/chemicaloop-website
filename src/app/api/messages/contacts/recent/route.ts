import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/tokenUtils';
import { API_CONFIG } from '@/config/api';

// GET /api/messages/contacts/recent - 获取最近联系人
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '10';
  const backendUrl = `${API_CONFIG.backendURL}/api/messages/contacts/recent?limit=${limit}`;

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'X-User-ID': userId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching recent contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch recent contacts' }, { status: 500 });
  }
}
