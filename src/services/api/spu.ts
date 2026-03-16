/**
 * SPU 相关 API 服务
 */

import { get, post, put, del, ApiResponse } from './request';

const BASE = '/api/admin/spu';

// ========== SPU 创建相关 ==========

/**
 * 检查 PubChem 连接
 */
export function checkPubChemConnection() {
  return get(`${BASE}/create/check-pubchem-connection`);
}

/**
 * 同步 PubChem 数据
 * @param cas CAS 号
 * @param preview 是否预览模式（不写入数据库）
 */
export function syncPubChem(cas: string, preview = true) {
  return post(`${BASE}/create/sync-pubchem`, { cas, preview });
}

/**
 * 匹配 HS 编码
 * @param cas CAS 号
 * @param name 化学品名称
 */
export function matchHsCode(cas: string, name?: string) {
  return post(`${BASE}/create/match-hs-code`, { cas, name });
}

/**
 * 生成产品图片
 */
export function generateImage(data: {
  productId?: string;
  spuId?: string;
  cas?: string;
  name?: string;
  force?: boolean;
  sdf?: string;
}) {
  return post(`${BASE}/create/generate-image`, data);
}

/**
 * 保存 SPU
 */
export function saveSpu(data: Record<string, any>) {
  return post(`${BASE}/create/save`, data);
}

// ========== SPU 列表相关 ==========

/**
 * 搜索 SPU
 */
export function searchSpu(query: string) {
  return get(`${BASE}/list/search?q=${encodeURIComponent(query)}`);
}

/**
 * 精确匹配 CAS
 */
export function searchByCas(cas: string) {
  return get(`${BASE}/list/search?cas=${encodeURIComponent(cas)}`);
}

/**
 * 获取 SPU 统计
 */
export function getSpuStats() {
  return get(`${BASE}/list/stats`);
}

/**
 * 获取 SPU 详情
 */
export function getSpuById(id: string) {
  return get(`${BASE}/list/${id}`);
}

/**
 * 删除 SPU
 */
export function deleteSpu(id: string) {
  return del(`${BASE}/list/${id}`);
}

/**
 * 清理重复数据
 */
export function cleanup(dryRun = true) {
  return post(`${BASE}/list/cleanup`, { dryRun });
}

// ========== 用户申请相关 ==========

/**
 * 获取用户申请列表
 */
export function getUserRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  
  const query = searchParams.toString();
  return get(`${BASE}/user-requests${query ? `?${query}` : ''}`);
}

/**
 * 创建用户申请
 */
export function createUserRequest(data: {
  cas: string;
  reason: string;
  reasonDetail?: string;
  userId: string;
  userEmail: string;
  userName: string;
}) {
  return post(`${BASE}/user-requests`, data);
}

/**
 * 审核用户申请
 */
export function reviewUserRequest(id: string, action: 'approve' | 'reject', rejectReason?: string) {
  return put(`${BASE}/user-requests`, { id, action, rejectReason });
}

/**
 * 删除用户申请
 */
export function deleteUserRequest(id: string, userId: string) {
  return del(`${BASE}/user-requests?id=${id}&userId=${userId}`);
}

// ========== 导出聚合对象 ==========

export const spuApi = {
  // 创建
  checkPubChemConnection,
  syncPubChem,
  matchHsCode,
  generateImage,
  saveSpu,
  
  // 列表
  searchSpu,
  searchByCas,
  getSpuStats,
  getSpuById,
  deleteSpu,
  cleanup,
  
  // 用户申请
  getUserRequests,
  createUserRequest,
  reviewUserRequest,
  deleteUserRequest,
};
