import { NextRequest, NextResponse } from 'next/server';

/**
 * 用户登出
 * 临时实现：仅返回成功，不做任何操作
 * TODO: 将 token 加入黑名单或清除服务器端会话
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求头中获取 token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // 临时实现：不做任何处理，直接返回成功
    // TODO: 将 token 加入黑名单或清除服务器端会话
    
    console.log('Logout request received for token:', token ? 'exists' : 'none');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
