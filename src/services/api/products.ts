/**
 * 产品列表 API 服务
 */

import { get, post, ApiResponse } from './request';

const BASE = '/api/admin/products';

export interface ProductListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * 获取产品列表
 */
export function getProducts(params?: ProductListParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  
  const query = searchParams.toString();
  return get(`${BASE}${query ? `?${query}` : ''}`);
}

/**
 * 创建产品
 */
export function createProduct(data: Record<string, any>) {
  return post(BASE, data);
}

export const productsApi = {
  getProducts,
  createProduct,
};
