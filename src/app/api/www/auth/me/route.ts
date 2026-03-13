import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

/**
 * 获取当前用户信息
 * 转发请求到后端 API 获取最新用户数据
 */
export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // 转发请求到后端 API
    const response = await fetch(`${API_CONFIG.backendURL}/api/auth/me`, {
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

    // 转换字段名：蛇形命名 -> 驼峰命名
    if (data.success && data.data) {
      const user = data.data;
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          internalEmailName: user.internal_email_name,
          internalEmail: user.internal_email,
          avatarUrl: user.avatar_url,
          role: user.role,
          verified: user.verified,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
