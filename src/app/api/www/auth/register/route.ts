import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

/**
 * 用户注册
 * 转发请求到后端 API 进行用户创建和 JWT token 生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      code, 
      internalEmailName,
      country,
      city,
      ...socialContacts 
    } = body;

    // 验证必填字段
    if (!email || !password || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and verification code are required' },
        { status: 400 }
      );
    }

    // 转发请求到后端 API
    const response = await fetch(`${API_CONFIG.backendURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        code,
        internal_email_name: internalEmailName,
        country,
        city,
        ...socialContacts,
      }),
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
            country: user.country,
            city: user.city,
          },
          token: data.data.token,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
