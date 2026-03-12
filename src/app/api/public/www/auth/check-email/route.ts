import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

/**
 * 检查邮箱是否可用
 * 转发请求到后端 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 转发请求到后端 API
    const response = await fetch(`${API_CONFIG.backendURL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/auth/check-email:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
