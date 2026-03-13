import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    // 调用后端API发送验证码
    const response = await fetch(`${API_CONFIG.backendURL}/api/www/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败' },
      { status: 500 }
    );
  }
}
