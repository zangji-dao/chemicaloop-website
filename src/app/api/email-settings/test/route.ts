import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * 测试邮箱连接
 */
export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 转发请求到后端
    const response = await fetch(`${BACKEND_URL}/api/email-settings/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test email connection' },
      { status: 500 }
    );
  }
}
