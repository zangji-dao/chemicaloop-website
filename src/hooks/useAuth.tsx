'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, login, register, getCurrentUser, logout, saveUser, getToken, clearAuth, getUser } from '@/services/authService';
import { hasRole, isAgentOrAbove, isAdminRole, isSuperAdmin } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  // 权限判断
  isAgent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (requiredRole: string) => boolean;
  // 原有方法
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    code: string,
    internalEmailName?: string,
    country?: string,
    city?: string,
    socialContacts?: Record<string, string>
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 计算权限
  const permissions = useMemo(() => {
    const role = user?.role || null;
    return {
      userRole: role,
      isAgent: isAgentOrAbove(role),
      isAdmin: isAdminRole(role),
      isSuperAdmin: isSuperAdmin(role),
      hasPermission: (requiredRole: string) => hasRole(role, requiredRole),
    };
  }, [user?.role]);

  // 初始化时检查认证状态（仅在无缓存用户时验证 token）
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const token = getToken();
        const cachedUser = getUser();

        if (token) {
          // 有缓存用户，直接使用，不重复验证（登录时已返回用户数据）
          if (cachedUser && isMounted) {
            setUser(cachedUser);
            setIsLoggedIn(true);
            setIsLoading(false);
            return; // 跳过 API 验证，提升性能
          }

          // 无缓存，需要验证 token
          const response = await getCurrentUser().catch(() => null);

          if (isMounted && response?.success && response.data) {
            setUser(response.data);
            setIsLoggedIn(true);
          }
        } else if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (err: any) {
        console.log('[useAuth] Auth check failed:', err.message);
        if (isMounted) {
          setError(err.message || 'Authentication failed');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // 登录
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[useAuth] Calling login function...');
      const response = await login(email, password);

      console.log('[useAuth] Login response:', response);

      if (response.success && response.data) {
        console.log('[useAuth] Setting user:', response.data.user);
        setUser(response.data.user);
        setIsLoggedIn(true);
      } else {
        throw new Error('Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const handleRegister = async (
    email: string,
    password: string,
    name: string,
    code: string,
    internalEmailName?: string,
    country?: string,
    city?: string,
    socialContacts?: Record<string, string>
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await register(email, password, name, code, internalEmailName, country, city, socialContacts);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsLoggedIn(true);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const handleLogout = async () => {
    // 调用 authService 的 logout（会调用后端 API）
    await logout();

    // 清除所有状态
    setUser(null);
    setIsLoggedIn(false);
    setError(null);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      console.log('[useAuth] Refreshing user...');
      const response = await getCurrentUser();
      console.log('[useAuth] Refresh response:', response);
      if (response.success && response.data) {
        console.log('[useAuth] Setting user:', response.data);
        setUser(response.data);
        setIsLoggedIn(true);
      } else {
        handleLogout();
      }
    } catch (err: any) {
      console.log('[useAuth] Failed to refresh user, logging out');
      handleLogout();
    }
  };

  const value: AuthContextType = {
    user,
    ...permissions,
    isLoggedIn,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
