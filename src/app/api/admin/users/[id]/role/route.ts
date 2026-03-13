import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { getToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getToken(request);
    const { id } = await params;
    const body = await request.json();

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const response = await fetch(`${API_CONFIG.backendURL}/api/admin/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || '更新失败' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
