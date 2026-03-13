/**
 * 应用常量
 * 包含用户角色、状态等静态常量
 */

// ============================================
// 用户角色
// ============================================

/**
 * 用户角色定义
 * 可扩展：未来添加服务商等角色
 */
export const ROLES = {
  USER: 'USER',           // 普通用户
  AGENT: 'AGENT',         // 代理商
  OPERATOR: 'OPERATOR',   // 运营（后台）
  ADMIN: 'ADMIN',         // 管理员
  // 未来扩展
  // SERVICE_PROVIDER: 'SERVICE_PROVIDER',  // 服务商
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * 角色层级（数字越大权限越高）
 */
export const ROLE_LEVELS: Record<string, number> = {
  USER: 1,
  AGENT: 2,
  OPERATOR: 3,
  ADMIN: 4,
};

/**
 * 判断用户是否有指定角色权限
 */
export function hasRole(userRole: string | null | undefined, requiredRole: string): boolean {
  if (!userRole) return false;
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}

/**
 * 判断是否是代理商及以上角色
 */
export function isAgentOrAbove(role: string | null | undefined): boolean {
  if (!role) return false;
  return ['AGENT', 'OPERATOR', 'ADMIN'].includes(role);
}

/**
 * 判断是否是管理员角色（可访问后台）
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ['OPERATOR', 'ADMIN'].includes(role);
}

/**
 * 判断是否是超级管理员
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'ADMIN';
}

/**
 * 后台可访问的角色列表
 */
export const ADMIN_ALLOWED_ROLES = ['OPERATOR', 'ADMIN'] as const;

/**
 * 代理商功能可访问的角色列表
 */
export const AGENT_ALLOWED_ROLES = ['AGENT', 'OPERATOR', 'ADMIN'] as const;
