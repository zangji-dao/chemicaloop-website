'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAdminRole, isSuperAdmin, hasRole } from '@/lib/constants';
import {
  getAdminToken,
  getAdminUser,
  clearAdminAuth,
  saveAdminUser,
  AdminUser,
} from '@/services/adminAuthService';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasPermission: (requiredRole: string) => boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    // 登录页面不需要验证
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    const token = getAdminToken();
    const userData = getAdminUser();

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    // 验证是否是管理员角色
    if (!isAdminRole(userData.role)) {
      console.warn('[AdminAuth] User is not an admin:', userData.role);
      clearAdminAuth();
      router.push('/admin/login');
      return;
    }
    
    setUser(userData);
    setIsLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(() => {
    clearAdminAuth();
    setUser(null);
    router.push('/admin/login');
  }, [router]);

  const refreshUser = useCallback(() => {
    const userData = getAdminUser();
    if (userData) {
      setUser(userData);
    } else {
      logout();
    }
  }, [logout]);

  const value: AdminAuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    isSuperAdmin: user ? isSuperAdmin(user.role) : false,
    isAdmin: user ? isAdminRole(user.role) : false,
    hasPermission: (requiredRole: string) => hasRole(user?.role, requiredRole),
    logout,
    refreshUser,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
}

// 从 adminAuthService 重新导出，保持向后兼容
export { getAdminToken, getAdminUser } from '@/services/adminAuthService';
