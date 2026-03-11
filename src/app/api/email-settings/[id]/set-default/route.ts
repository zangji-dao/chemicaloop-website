import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

/**
 * 设置默认邮箱
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 转发请求到后端
    const response = await fetch(`${API_CONFIG.backendURL}/api/email-settings/${id}/set-default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error setting default email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set default email' },
      { status: 500 }
    );
  }
}
