/**
 * S3 对象存储工具函数
 * 
 * 图片存储在腾讯云 COS（公共读），直接拼接 URL 即可
 * 无需签名认证
 */

import { STORAGE_CONFIG } from './env';

/**
 * 生成腾讯云 COS 图片完整 URL
 * @param key 存储的文件 key 或完整 URL
 * @returns 图片访问 URL
 */
export function getImageUrl(key: string): string {
  if (!key) {
    return '';
  }

  // 如果已经是完整 URL，直接返回
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  // 拼接腾讯云 COS 公共 URL
  return `https://${STORAGE_CONFIG.cdnDomain}/${key}`;
}

/**
 * 批量生成图片 URL
 * @param keys 存储的文件 key 数组
 * @returns key -> URL 的映射对象
 */
export function getImageUrls(keys: string[]): Record<string, string> {
  if (!keys || keys.length === 0) {
    return {};
  }

  return keys.reduce((acc, key) => {
    if (key) {
      acc[key] = getImageUrl(key);
    }
    return acc;
  }, {} as Record<string, string>);
}

// ============================================
// 兼容旧 API（保持向后兼容）
// ============================================

/**
 * 生成单个图片的签名 URL
 * @deprecated 使用 getImageUrl 代替
 */
export async function getSignedImageUrl(
  key: string,
  _expireTime: number = 86400
): Promise<string> {
  return getImageUrl(key);
}

/**
 * 批量生成图片签名 URL
 * @deprecated 使用 getImageUrls 代替
 */
export async function getSignedImageUrls(
  keys: string[],
  _expireTime: number = 86400
): Promise<Record<string, string>> {
  return getImageUrls(keys);
}

/**
 * 生成 API 路径（用于前端调用）
 * @deprecated 直接使用 getImageUrl 生成完整 URL
 */
export function getApiUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `/api/common/image-url?key=${encodeURIComponent(key)}`;
}

/**
 * 批量生成 API 路径
 * @deprecated 使用 getImageUrls 代替
 */
export function getApiUrls(keys: string[]): Record<string, string> {
  return getImageUrls(keys);
}
