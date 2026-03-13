import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

/**
 * 发送外网邮件
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

    // 验证必填字段
    if (!body.to || !body.subject || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, content' },
        { status: 400 }
      );
    }

    // 转发请求到后端
    const response = await fetch(`${API_CONFIG.backendURL}/api/www/email-settings/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
