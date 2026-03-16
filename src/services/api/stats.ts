/**
 * 统计数据 API 服务
 */

import { get, ApiResponse } from './request';

/**
 * 获取管理后台统计数据
 */
export function getStats() {
  return get('/api/admin/stats');
}

export const statsApi = {
  getStats,
};
