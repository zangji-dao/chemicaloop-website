/**
 * API 请求基础封装
 * 统一处理 token、错误处理、响应解析
 */

import { getAdminToken } from '@/services/adminAuthService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
  skipAuth?: boolean;
}

/**
 * 基础请求函数
 * 返回原始响应数据，不强制类型
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth = false, ...fetchOptions } = options;

  // 自动添加 token（除非跳过）
  const authToken = token ?? (skipAuth ? null : getAdminToken());

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      } as T;
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    } as T;
  }
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, body?: any, options?: RequestOptions) {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, body?: any, options?: RequestOptions) {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'DELETE' });
}
