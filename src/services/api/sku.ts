/**
 * SKU (代理商产品) 相关 API 服务
 */

import { get, post, put, ApiResponse } from './request';

const BASE = '/api/admin/sku/review';

/**
 * 获取产品审核预览信息
 */
export function getReviewPreview(id: string) {
  return get(`${BASE}/${id}/review`);
}

/**
 * 审核产品（通过/拒绝）
 */
export function reviewProduct(id: string, data: {
  status: 'approved' | 'rejected';
  review_note?: string;
  skipSync?: boolean;
}) {
  return post(`${BASE}/${id}/review`, data);
}

/**
 * 更新产品状态
 */
export function updateStatus(id: string, status: string) {
  return put(`${BASE}/${id}/status`, { status });
}

/**
 * 翻译产品信息
 */
export function translateProduct(data: {
  productId: string;
  targetLanguage: string;
  fields?: ('name' | 'remark' | 'origin')[];
}) {
  return post(`${BASE}/translate`, data);
}

/**
 * 批量更新状态
 */
export function batchUpdateStatus(ids: string[], status: string) {
  return put(`${BASE}/batch-status`, { ids, status });
}

/**
 * 上架产品
 */
export function listingProduct(id: string) {
  return post(`${BASE}/listing`, { id });
}

// ========== 导出聚合对象 ==========

export const skuApi = {
  getReviewPreview,
  reviewProduct,
  updateStatus,
  translateProduct,
  batchUpdateStatus,
  listingProduct,
};
