import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ADMIN_ALLOWED_ROLES, AGENT_ALLOWED_ROLES, isSuperAdmin, isAdminRole, isAgentOrAbove } from './constants';

/**
 * 认证结果类型
 */
export interface AuthResult {
  success: true;
  userId: string;
  role: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export type AuthResponse = AuthResult | AuthError;

/**
 * 从请求头提取 Token（不验证）
 * 用于需要转发 token 到后端的场景
 */
export function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  return token || null;
}

/**
 * 基础验证：验证 token 是否有效
 * 返回用户 ID 和角色
 */
export function verifyToken(request: NextRequest): AuthResponse {
  // 优先检查 x-user-id header（由后端 Express 服务传递）
  const headerUserId = request.headers.get('x-user-id');
  const headerUserRole = request.headers.get('x-user-role');
  
  if (headerUserId && headerUserRole) {
    return { success: true, userId: headerUserId, role: headerUserRole };
  }

  // 从 Authorization header 验证 token
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { success: false, error: '未授权', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return { success: false, error: '未授权', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      role: string;
    };
    return { success: true, userId: decoded.userId, role: decoded.role };
  } catch {
    return { success: false, error: 'Token 无效或已过期', status: 401 };
  }
}

/**
 * 获取用户 ID（不验证角色）
 * 用于只需要知道"是谁"的场景，兼容 x-user-id header
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // 优先检查 x-user-id header
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // 从 token 解析
  const auth = verifyToken(request);
  return auth.success ? auth.userId : null;
}

/**
 * 验证用户权限（只验证登录，不验证角色）
 * 用于普通用户 API
 */
export function verifyUser(request: NextRequest): AuthResponse {
  return verifyToken(request);
}

/**
 * 验证代理商权限
 * AGENT / OPERATOR / ADMIN 可访问
 */
export function verifyAgent(request: NextRequest): AuthResponse {
  const auth = verifyToken(request);
  if (!auth.success) return auth;
  
  if (!isAgentOrAbove(auth.role)) {
    return { success: false, error: '需要代理商权限', status: 403 };
  }
  return auth;
}

/**
 * 验证管理员权限
 * OPERATOR / ADMIN 可访问
 */
export function verifyAdmin(request: NextRequest): AuthResponse {
  const auth = verifyToken(request);
  if (!auth.success) return auth;
  
  if (!isAdminRole(auth.role)) {
    return { success: false, error: '需要管理员权限', status: 403 };
  }
  return auth;
}

/**
 * 验证超级管理员权限
 * 仅 ADMIN 可访问
 */
export function verifySuperAdmin(request: NextRequest): AuthResponse {
  const auth = verifyToken(request);
  if (!auth.success) return auth;
  
  if (!isSuperAdmin(auth.role)) {
    return { success: false, error: '需要超级管理员权限', status: 403 };
  }
  return auth;
}

/**
 * 创建未授权响应
 */
export function unauthorizedResponse(error: string = '未授权'): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

/**
 * 创建禁止访问响应
 */
export function forbiddenResponse(error: string = '无权访问'): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

/**
 * 获取用户 ID（用于需要 userId 但不强制验证的场景）
 */
export function getUserId(request: NextRequest): string | null {
  const auth = verifyToken(request);
  return auth.success ? auth.userId : null;
}

/**
 * 获取用户角色（用于需要 role 但不强制验证的场景）
 */
export function getUserRole(request: NextRequest): string | null {
  const auth = verifyToken(request);
  return auth.success ? auth.role : null;
}

// 导出角色验证函数，方便使用
export { isAgentOrAbove, isAdminRole, isSuperAdmin, ADMIN_ALLOWED_ROLES, AGENT_ALLOWED_ROLES };
