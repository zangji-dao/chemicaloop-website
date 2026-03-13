'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { hasRole } from '@/lib/constants';

interface PermissionGateProps {
  /** 需要的最低角色权限 */
  requiredRole?: string;
  /** 是否需要代理商权限 */
  requireAgent?: boolean;
  /** 是否需要管理员权限 */
  requireAdmin?: boolean;
  /** 是否需要超级管理员权限 */
  requireSuperAdmin?: boolean;
  /** 无权限时显示的内容 */
  fallback?: ReactNode;
  /** 子组件 */
  children: ReactNode;
  /** 是否在管理后台使用（默认 false，用于普通用户前端） */
  adminMode?: boolean;
}

/**
 * 权限控制组件
 * 根据用户角色控制内容的显示
 * 
 * @example
 * // 代理商功能
 * <PermissionGate requireAgent fallback={<div>需要代理商权限</div>}>
 *   <AgentDashboard />
 * </PermissionGate>
 * 
 * @example
 * // 指定角色
 * <PermissionGate requiredRole="AGENT">
 *   <AgentOnlyContent />
 * </PermissionGate>
 * 
 * @example
 * // 管理后台
 * <PermissionGate requireSuperAdmin adminMode>
 *   <SuperAdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  requiredRole,
  requireAgent,
  requireAdmin,
  requireSuperAdmin,
  fallback = null,
  children,
  adminMode = false,
}: PermissionGateProps) {
  // 根据 adminMode 选择不同的 auth hook
  const auth = adminMode ? useAdminAuth() : null;
  const wwwAuth = !adminMode ? useAuth() : null;

  // 获取用户角色
  const userRole = adminMode ? auth?.user?.role : wwwAuth?.userRole;

  // 检查权限
  let hasPermission = true;

  if (requireSuperAdmin) {
    hasPermission = userRole === 'ADMIN';
  } else if (requireAdmin) {
    hasPermission = hasRole(userRole, 'OPERATOR');
  } else if (requireAgent) {
    hasPermission = hasRole(userRole, 'AGENT');
  } else if (requiredRole) {
    hasPermission = hasRole(userRole, requiredRole);
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 代理商专用内容包装器
 */
export function AgentOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate requireAgent fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * 管理员专用内容包装器（普通用户前端）
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate requireAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * 超级管理员专用内容包装器（管理后台）
 */
export function SuperAdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate requireSuperAdmin adminMode fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
