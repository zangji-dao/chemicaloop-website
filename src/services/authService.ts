const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  internalEmailName?: string;
  internalEmail?: string;
  avatarUrl?: string | null;
  role: 'USER' | 'AGENT' | 'ADMIN';
  verified: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  error?: string;
}

// Token 管理
export const authKeys = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  USER_ROLE: 'auth_user_role',
};

// 保存 token
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(authKeys.TOKEN, token);
  }
};

// 获取 token
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(authKeys.TOKEN);
  }
  return null;
};

// 保存用户信息
export const saveUser = (user: User): void => {
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem(authKeys.USER, JSON.stringify(user));
    localStorage.setItem(authKeys.USER_ROLE, user.role);
  }
};

// 获取用户信息
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(authKeys.USER);
    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr);
      // 验证 user 对象是否有效
      if (!user || typeof user !== 'object') {
        console.warn('[AuthService] Invalid user data in localStorage');
        return null;
      }
      return user;
    } catch (error) {
      console.error('[AuthService] Failed to parse user from localStorage:', error);
      return null;
    }
  }
  return null;
};

// 清除认证信息
export const clearAuth = (): void => {
  if (typeof window !== 'undefined') {
    // 移除所有可能的认证相关 key
    const keysToRemove = [
      authKeys.TOKEN,
      authKeys.USER,
      authKeys.USER_ROLE,
      'isLoggedIn',
      'authToken',  // 驼峰命名版本
      'user',       // 简化命名版本
      'agent_code'  // 代理代码
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 强力清除整个 localStorage（最彻底）
    try {
      localStorage.clear();
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// API 请求辅助函数
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

// ==================== 认证 API ====================

// 检查邮箱是否可用
export const checkEmailAvailability = async (email: string): Promise<{ success: boolean; available: boolean; error?: string }> => {
  return apiRequest('/api/public/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

// 发送验证码
export const sendVerificationCode = async (email: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/public/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

// 注册
export const register = async (
  email: string,
  password: string,
  name: string,
  code: string,
  internalEmailName?: string,
  country?: string,
  city?: string,
  socialContacts?: Record<string, string>
): Promise<RegisterResponse> => {
  const response = await apiRequest('/api/public/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name,
      code,
      internalEmailName,
      country,
      city,
      ...socialContacts,
    }),
  });
  
  // 保存 token 和用户信息
  if (response.success && response.data?.token) {
    saveToken(response.data.token);
    saveUser(response.data.user);
  }
  
  return response;
};

// 登录
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await apiRequest('/api/public/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('[AuthService] Login response:', JSON.stringify(response, null, 2));

    // 保存 token 和用户信息
    if (response.success && response.data?.token) {
      console.log('[AuthService] Saving token and user:', response.data.user);
      saveToken(response.data.token);
      saveUser(response.data.user);
    }

    return response;
  } catch (error) {
    console.error('[AuthService] Login API error:', error);
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/api/private/www/auth/me');
    
    if (response.success && response.data) {
      saveUser(response.data);
    }
    
    return response;
  } catch (error: any) {
    clearAuth();
    return { success: false, error: error.message || 'Failed to get user' };
  }
};

// 登出
export const logout = async (): Promise<void> => {
  try {
    console.log('logout: Calling backend logout API...');

    // 调用后端退出登录 API，使 token 失效
    const response = await apiRequest('/api/private/www/auth/logout', {
      method: 'POST',
    });

    console.log('logout: Backend logout response:', response);

    // 清除前端认证信息
    clearAuth();

    console.log('logout: Frontend auth data cleared');
  } catch (error: any) {
    console.error('logout: Backend logout API failed:', error);
    // 即使后端 API 失败，也要清除前端认证信息
    clearAuth();
  }
};

// 验证 token 有效性
export const validateToken = async (): Promise<boolean> => {
  try {
    const response = await getCurrentUser();
    return response.success;
  } catch {
    return false;
  }
};

// 修改密码
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiRequest('/api/private/www/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return response;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to change password' };
  }
};

// 请求重置密码
export const forgotPassword = async (
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send reset link' };
  }
};

// 重置密码
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    return response;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reset password' };
  }
};
