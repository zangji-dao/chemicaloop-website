/**
 * 认证高阶函数
 * 用于包装 API route handler，自动处理认证逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, verifyAgent, verifyUser, verifySuperAdmin, AuthResult } from './auth';

/**
 * API Handler 类型
 */
type Handler<T = any> = (
  request: NextRequest,
  context: T,
  auth: AuthResult
) => Promise<NextResponse>;

/**
 * 创建认证错误响应
 */
function authErrorResponse(status: number, error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * 创建认证高阶函数
 */
function createAuthWrapper(verifyFn: (request: NextRequest) => any) {
  return function <T = any>(handler: Handler<T>) {
    return async (request: NextRequest, context: T): Promise<NextResponse> => {
      const auth = verifyFn(request);
      
      if (!auth.success) {
        return authErrorResponse(auth.status, auth.error);
      }
      
      return handler(request, context, auth);
    };
  };
}

/**
 * 管理员权限验证包装器
 * OPERATOR / ADMIN 可访问
 */
export const withAdminAuth = createAuthWrapper(verifyAdmin);

/**
 * 代理商权限验证包装器
 * AGENT / OPERATOR / ADMIN 可访问
 */
export const withAgentAuth = createAuthWrapper(verifyAgent);

/**
 * 普通用户验证包装器
 * 登录用户即可访问
 */
export const withUserAuth = createAuthWrapper(verifyUser);

/**
 * 超级管理员权限验证包装器
 * 仅 ADMIN 可访问
 */
export const withSuperAdminAuth = createAuthWrapper(verifySuperAdmin);

/**
 * 同时支持 GET 和 POST 的认证包装器
 */
export const withAuth = {
  admin: withAdminAuth,
  agent: withAgentAuth,
  user: withUserAuth,
  superAdmin: withSuperAdminAuth,
};
