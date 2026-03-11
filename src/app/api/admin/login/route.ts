import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 调用后端登录接口
    const response = await fetch(`${API_CONFIG.backendURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || '登录失败' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      user: data.user,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
