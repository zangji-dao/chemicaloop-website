/**
 * S3 对象存储工具函数
 * 
 * 沙箱环境：使用 S3Storage 生成签名 URL
 * 生产环境：腾讯云 COS（公共读），可直接拼接 URL
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import { isSandbox, COS_CONFIG, COS_CREDENTIALS } from './env';

/**
 * 创建存储客户端
 */
const createStorage = (): S3Storage | null => {
  if (isSandbox) {
    // 沙箱环境：使用系统对象存储
    return new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      bucketName: process.env.COZE_BUCKET_NAME,
      accessKey: '',
      secretKey: '',
      region: 'cn-beijing',
    });
  } else if (COS_CREDENTIALS.accessKeyId) {
    // 生产环境：使用腾讯云 COS
    return new S3Storage({
      endpointUrl: `https://cos.${COS_CONFIG.region}.myqcloud.com`,
      bucketName: COS_CONFIG.bucket,
      accessKey: COS_CREDENTIALS.accessKeyId,
      secretKey: COS_CREDENTIALS.secretAccessKey,
      region: COS_CONFIG.region,
    });
  }
  return null;
};

const storage = createStorage();

/**
 * 生成图片访问 URL
 * 
 * 沙箱环境：使用 S3Storage.generatePresignedUrl 生成签名 URL
 * 生产环境：腾讯云 COS 公共读，直接拼接 URL
 * 
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

  // 生产环境：腾讯云 COS 公共读，直接拼接 URL
  if (!isSandbox) {
    return `https://${COS_CONFIG.cdnDomain}/${key}`;
  }

  // 沙箱环境：返回 API 路径（需要通过 API 生成签名 URL）
  return `/api/common/image-url?key=${encodeURIComponent(key)}`;
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

/**
 * 生成单个图片的签名 URL（异步）
 * 
 * 沙箱环境：使用 S3Storage.generatePresignedUrl
 * 生产环境：直接拼接腾讯云 COS 公共 URL
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

  // 生产环境：腾讯云 COS 公共读
  if (!isSandbox) {
    return `https://${COS_CONFIG.cdnDomain}/${key}`;
  }

  // 沙箱环境：使用 S3Storage 生成签名 URL
  if (storage) {
    try {
      return await storage.generatePresignedUrl({ key, expireTime });
    } catch (error) {
      console.error('[S3Utils] Failed to generate signed URL:', error);
      // fallback: 返回 API 路径
      return `/api/common/image-url?key=${encodeURIComponent(key)}`;
    }
  }

  return `/api/common/image-url?key=${encodeURIComponent(key)}`;
}

/**
 * 批量生成图片签名 URL
 */
export async function getSignedImageUrls(
  keys: string[],
  expireTime: number = 86400
): Promise<Record<string, string>> {
  if (!keys || keys.length === 0) {
    return {};
  }

  // 生产环境：直接拼接 URL
  if (!isSandbox) {
    const result: Record<string, string> = {};
    for (const key of keys) {
      if (key) {
        if (key.startsWith('http://') || key.startsWith('https://')) {
          result[key] = key;
        } else {
          result[key] = `https://${COS_CONFIG.cdnDomain}/${key}`;
        }
      }
    }
    return result;
  }

  // 沙箱环境：使用 S3Storage 生成签名 URL
  if (storage) {
    try {
      const result: Record<string, string> = {};
      for (const key of keys) {
        if (key) {
          if (key.startsWith('http://') || key.startsWith('https://')) {
            result[key] = key;
          } else {
            result[key] = await storage.generatePresignedUrl({ key, expireTime });
          }
        }
      }
      return result;
    } catch (error) {
      console.error('[S3Utils] Failed to generate signed URLs:', error);
      // fallback: 返回 API 路径
      const result: Record<string, string> = {};
      for (const key of keys) {
        if (key) {
          result[key] = `/api/common/image-url?key=${encodeURIComponent(key)}`;
        }
      }
      return result;
    }
  }

  // fallback
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (key) {
      result[key] = `/api/common/image-url?key=${encodeURIComponent(key)}`;
    }
  }
  return result;
}

/**
 * 生成 API 路径（用于前端调用）
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
 */
export function getApiUrls(keys: string[]): Record<string, string> {
  return getImageUrls(keys);
}
