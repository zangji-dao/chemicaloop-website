import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const response = await fetch(`${API_CONFIG.backendURL}/api/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || '获取失败' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
