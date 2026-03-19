/**
 * S3 对象存储工具函数
 * 提供统一的图片签名 URL 生成服务
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import { STORAGE_CONFIG, getCosImageUrl, FEATURE_FLAGS } from './env';

// S3 存储实例（延迟初始化）
let storageInstance: S3Storage | null = null;

/**
 * 获取 S3 存储实例（单例模式）
 */
function getStorage(): S3Storage | null {
  if (!FEATURE_FLAGS.enableImageSigning) {
    return null;
  }
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: STORAGE_CONFIG.bucket,
      region: STORAGE_CONFIG.region,
    });
  }
  return storageInstance;
}

/**
 * 生成单个图片的签名 URL
 * @param key S3 存储的文件 key 或完整 URL
 * @param expireTime 过期时间（秒），默认 24 小时
 * @returns 签名后的 URL 或原始 URL
 */
export async function getSignedImageUrl(
  key: string,
  expireTime: number = 86400
): Promise<string> {
  if (!key) {
    return '';
  }

  // 如果已经是完整 URL，直接返回
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  // 如果没有配置存储认证，直接拼接 COS URL
  const storage = getStorage();
  if (!storage) {
    return getCosImageUrl(key);
  }

  return storage.generatePresignedUrl({ key, expireTime });
}

/**
 * 批量生成图片签名 URL
 * @param keys S3 存储的文件 key 数组
 * @param expireTime 过期时间（秒），默认 24 小时
 * @returns key -> URL 的映射对象
 */
export async function getSignedImageUrls(
  keys: string[],
  expireTime: number = 86400
): Promise<Record<string, string>> {
  if (!keys || keys.length === 0) {
    return {};
  }

  // 过滤掉空值
  const validKeys = keys.filter(k => k);
  
  if (validKeys.length === 0) {
    return {};
  }

  // 如果没有配置存储认证，直接拼接 COS URL
  const storage = getStorage();
  if (!storage) {
    return validKeys.reduce((acc, key) => {
      acc[key] = getCosImageUrl(key);
      return acc;
    }, {} as Record<string, string>);
  }

  // 有认证，生成签名 URL
  const results = await Promise.all(
    validKeys.map(async (key) => {
      // 如果已经是完整 URL，直接返回
      if (key.startsWith('http://') || key.startsWith('https://')) {
        return { key, url: key };
      }
      const url = await storage.generatePresignedUrl({ key, expireTime });
      return { key, url };
    })
  );

  return Object.fromEntries(results.map(r => [r.key, r.url]));
}

/**
 * 上传文件到 S3
 * @param fileContent 文件内容（Buffer）
 * @param fileName 文件名（包含路径）
 * @param contentType 文件 MIME 类型
 * @returns 上传后的文件 key
 */
export async function uploadFile(
  fileContent: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const storage = getStorage();
  if (!storage) {
    throw new Error('S3Storage not configured. Set COZE_WORKLOAD_IDENTITY_API_KEY');
  }
  return storage.uploadFile({
    fileContent,
    fileName,
    contentType,
  });
}

/**
 * 生成 API 路径（用于前端调用）
 * @param key S3 存储的文件 key
 * @returns API 路径
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
 * @param keys S3 存储的文件 key 数组
 * @returns key -> API URL 的映射对象
 */
export function getApiUrls(keys: string[]): Record<string, string> {
  return keys.reduce((acc, key) => {
    if (key) acc[key] = getApiUrl(key);
    return acc;
  }, {} as Record<string, string>);
}
