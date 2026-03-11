import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * 用户登录
 * 转发请求到后端 API 进行密码验证和 JWT token 生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 转发请求到后端 API
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // 转换字段名：蛇形命名 -> 驼峰命名
    if (data.success && data.data?.user) {
      const user = data.data.user;
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            internalEmailName: user.internal_email_name || user.internalEmailName,
            internalEmail: user.internal_email || user.internalEmail,
            avatarUrl: user.avatar_url || user.avatarUrl,
            role: user.role,
            verified: user.verified,
          },
          token: data.data.token,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
