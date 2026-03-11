/**
 * 管理后台认证服务
 * 统一管理 admin_token 和 admin_user 的存取
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

// Token 管理常量
export const ADMIN_AUTH_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user',
} as const;

/**
 * 检查是否在浏览器环境
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

// ==================== Token 管理 ====================

/**
 * 保存管理员 Token
 */
export const saveAdminToken = (token: string): void => {
  if (isBrowser() && token) {
    localStorage.setItem(ADMIN_AUTH_KEYS.TOKEN, token);
  }
};

/**
 * 获取管理员 Token
 */
export const getAdminToken = (): string | null => {
  if (isBrowser()) {
    return localStorage.getItem(ADMIN_AUTH_KEYS.TOKEN);
  }
  return null;
};

/**
 * 移除管理员 Token
 */
export const removeAdminToken = (): void => {
  if (isBrowser()) {
    localStorage.removeItem(ADMIN_AUTH_KEYS.TOKEN);
  }
};

// ==================== 用户信息管理 ====================

/**
 * 保存管理员用户信息
 */
export const saveAdminUser = (user: AdminUser): void => {
  if (isBrowser() && user) {
    localStorage.setItem(ADMIN_AUTH_KEYS.USER, JSON.stringify(user));
  }
};

/**
 * 获取管理员用户信息
 */
export const getAdminUser = (): AdminUser | null => {
  if (!isBrowser()) return null;
  
  const userStr = localStorage.getItem(ADMIN_AUTH_KEYS.USER);
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    if (!user || typeof user !== 'object') {
      console.warn('[AdminAuthService] Invalid admin user data');
      return null;
    }
    return user;
  } catch (error) {
    console.error('[AdminAuthService] Failed to parse admin user:', error);
    return null;
  }
};

/**
 * 移除管理员用户信息
 */
export const removeAdminUser = (): void => {
  if (isBrowser()) {
    localStorage.removeItem(ADMIN_AUTH_KEYS.USER);
  }
};

// ==================== 认证状态管理 ====================

/**
 * 清除所有管理员认证信息
 */
export const clearAdminAuth = (): void => {
  removeAdminToken();
  removeAdminUser();
};

/**
 * 检查管理员是否已登录
 */
export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

/**
 * 保存认证信息（Token + User）
 */
export const saveAdminAuth = (token: string, user: AdminUser): void => {
  saveAdminToken(token);
  saveAdminUser(user);
};

/**
 * 获取认证信息（Token + User）
 */
export const getAdminAuth = (): { token: string | null; user: AdminUser | null } => {
  return {
    token: getAdminToken(),
    user: getAdminUser(),
  };
};

// ==================== 请求辅助 ====================

/**
 * 创建带认证头的 fetch 配置
 */
export const getAdminAuthHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
