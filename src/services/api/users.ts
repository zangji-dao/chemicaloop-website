/**
 * 用户管理 API 服务
 */

import { get, put, ApiResponse } from './request';

const BASE = '/api/admin/users';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

/**
 * 获取用户列表
 */
export function getUsers(params?: UserListParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.role) searchParams.set('role', params.role);
  
  const query = searchParams.toString();
  return get(`${BASE}${query ? `?${query}` : ''}`);
}

/**
 * 更新用户角色
 */
export function updateUserRole(userId: string, role: string) {
  return put(`${BASE}/${userId}/role`, { role });
}

export const usersApi = {
  getUsers,
  updateUserRole,
};
