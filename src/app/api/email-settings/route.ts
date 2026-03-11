import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * 获取邮箱配置
 */
export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 转发请求到后端
    const response = await fetch(`${BACKEND_URL}/api/email-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

/**
 * 保存邮箱配置
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
    if (!body.senderName || !body.email || !body.smtpHost || !body.smtpPort) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 转发请求到后端
    const response = await fetch(`${BACKEND_URL}/api/email-settings`, {
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
    console.error('Error saving email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
}
