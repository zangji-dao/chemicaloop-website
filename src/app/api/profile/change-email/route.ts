import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newEmail, code } = body;
    
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    // 调用后端API修改邮箱
    const response = await fetch(`${BACKEND_URL}/api/auth/change-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ newEmail, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Change email error:', error);
    return NextResponse.json(
      { success: false, error: '修改邮箱失败' },
      { status: 500 }
    );
  }
}
