import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Get all users
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (role) params.append('role', role);

    const response = await fetch(`${BACKEND_URL}/api/admin/users?${params}`, {
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
    console.error('Get users error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
