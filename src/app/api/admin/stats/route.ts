import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
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
