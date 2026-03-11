import { NextRequest } from 'next/server';

/**
 * 从 JWT token 中提取用户 ID
 * 这个函数处理可能重复的 "Bearer " 前缀
 */
export function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return null;
    }

    // 移除 "Bearer " 前缀（处理可能重复的情况）
    let token = authHeader;
    while (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    if (!token) {
      return null;
    }

    // 解码 JWT token（不验证签名，仅提取用户信息）
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[getUserIdFromToken] Invalid JWT format (should have 3 parts)');
      return null;
    }

    // 解码 payload（base64url 编码）
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decodedPayload = JSON.parse(Buffer.from(paddedBase64, 'base64').toString('utf-8'));

    // 从 token 中提取用户 ID
    const userId = decodedPayload.userId || decodedPayload.sub || null;

    return userId;
  } catch (error) {
    console.error('[getUserIdFromToken] Failed to decode token:', error);
    return null;
  }
}
