/**
 * S3 对象存储工具函数
 * 提供统一的图片签名 URL 生成服务
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import { STORAGE_CONFIG, getCosImageUrl, FEATURE_FLAGS } from './env';

// S3 存储实例（延迟初始化）
let storageInstance: S3Storage | null = null;

/**
 * 从带签名的 URL 中提取 key
 * 支持格式：
 * - https://coze-coding-project.tos.coze.site/coze_storage_xxx/path/file.svg?sign=xxx
 * - https://tianzhi-1314611801.cos.ap-beijing.myqcloud.com/path/file.svg
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Coze 存储桶 URL：提取路径（去掉存储桶前缀和签名参数）
    if (urlObj.hostname.includes('coze.site') || urlObj.hostname.includes('tos.coze')) {
      // 路径格式：/coze_storage_xxx/path/file.svg
      const pathParts = urlObj.pathname.split('/');
      // 去掉第一个空元素和存储桶名称
      const key = pathParts.slice(2).join('/');
      return key || null;
    }
    // 腾讯云 COS URL
    if (urlObj.hostname.includes('cos.ap-beijing.myqcloud.com')) {
      // 路径格式：/path/file.svg
      return urlObj.pathname.slice(1);
    }
  } catch {
    // 不是有效 URL，返回 null
  }
  return null;
}

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
 * @param key S3 存储的文件 key 或完整 URL（支持带过期签名的 URL）
 * @param expireTime 过期时间（秒），默认 24 小时
 * @returns 签名后的 URL
 */
export async function getSignedImageUrl(
  key: string,
  expireTime: number = 86400
): Promise<string> {
  if (!key) {
    return '';
  }

  // 如果已经是完整 URL，尝试提取 key 后重新生成签名
  if (key.startsWith('http://') || key.startsWith('https://')) {
    const extractedKey = extractKeyFromUrl(key);
    if (extractedKey) {
      // 提取成功，使用 key 生成新的签名 URL
      const storage = getStorage();
      if (storage) {
        return storage.generatePresignedUrl({ key: extractedKey, expireTime });
      }
      // 没有存储认证，尝试拼接 COS URL
      return getCosImageUrl(extractedKey);
    }
    // 无法提取 key，直接返回原始 URL
    return key;
  }

  // 纯 key，生成签名 URL
  const storage = getStorage();
  if (!storage) {
    return getCosImageUrl(key);
  }

  return storage.generatePresignedUrl({ key, expireTime });
}

/**
 * 批量生成图片签名 URL
 * @param keys S3 存储的文件 key 数组（支持带过期签名的完整 URL）
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

  // 获取存储实例
  const storage = getStorage();

  // 处理每个 key
  const results = await Promise.all(
    validKeys.map(async (originalKey) => {
      let actualKey = originalKey;
      
      // 如果是完整 URL，尝试提取 key
      if (originalKey.startsWith('http://') || originalKey.startsWith('https://')) {
        const extractedKey = extractKeyFromUrl(originalKey);
        if (extractedKey) {
          actualKey = extractedKey;
        } else {
          // 无法提取 key，直接返回原始 URL
          return { key: originalKey, url: originalKey };
        }
      }
      
      // 生成签名 URL
      if (storage) {
        const url = await storage.generatePresignedUrl({ key: actualKey, expireTime });
        return { key: originalKey, url };
      } else {
        // 没有存储认证，拼接 COS URL
        return { key: originalKey, url: getCosImageUrl(actualKey) };
      }
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
