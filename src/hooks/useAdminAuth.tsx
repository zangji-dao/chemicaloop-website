'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAdminRole, isSuperAdmin, hasRole } from '@/lib/constants/roles';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

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

const AUTH_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user',
};

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

    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    const userData = localStorage.getItem(AUTH_KEYS.USER);

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as AdminUser;
      
      // 验证是否是管理员角色
      if (!isAdminRole(parsedUser.role)) {
        console.warn('[AdminAuth] User is not an admin:', parsedUser.role);
        localStorage.removeItem(AUTH_KEYS.TOKEN);
        localStorage.removeItem(AUTH_KEYS.USER);
        router.push('/admin/login');
        return;
      }
      
      setUser(parsedUser);
    } catch {
      localStorage.removeItem(AUTH_KEYS.TOKEN);
      localStorage.removeItem(AUTH_KEYS.USER);
      router.push('/admin/login');
      return;
    }

    setIsLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER);
    setUser(null);
    router.push('/admin/login');
  }, [router]);

  const refreshUser = useCallback(() => {
    const userData = localStorage.getItem(AUTH_KEYS.USER);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        logout();
      }
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

/**
 * 获取管理后台 Token
 */
export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
  }
  return null;
}

/**
 * 获取管理后台用户信息
 */
export function getAdminUser(): AdminUser | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem(AUTH_KEYS.USER);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
  }
  return null;
}
