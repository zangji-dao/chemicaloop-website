/**
 * PubChem 预览缓存
 * 用于预览模式，缓存 5 分钟
 */

import { PUBCHEM_CONFIG } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 内存缓存
const previewCache = new Map<string, CacheEntry<any>>();

/**
 * 获取缓存的预览数据
 */
export function getCachedPreview<T>(cas: string): T | null {
  const cached = previewCache.get(cas);
  if (cached && Date.now() - cached.timestamp < PUBCHEM_CONFIG.CACHE_TTL) {
    console.log(`[PubChem Cache] Hit for ${cas}`);
    return cached.data;
  }
  return null;
}

/**
 * 缓存预览数据
 */
export function setCachedPreview<T>(cas: string, data: T): void {
  previewCache.set(cas, { data, timestamp: Date.now() });
  console.log(`[PubChem Cache] Cached for ${cas}`);
}

/**
 * 清除缓存
 */
export function clearCache(cas?: string): void {
  if (cas) {
    previewCache.delete(cas);
  } else {
    previewCache.clear();
  }
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: previewCache.size,
    keys: Array.from(previewCache.keys()),
  };
}
