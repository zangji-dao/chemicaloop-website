/**
 * 环境变量统一管理
 * 
 * 敏感信息通过 .env.local 配置（不上传 GitHub）
 * 公开配置通过 .env 配置（可上传）
 * 
 * 环境变量优先级：
 * 1. .env.local（本地/生产环境，敏感信息）
 * 2. .env（默认配置，可上传）
 * 3. 代码中的默认值
 */

// ============================================
// 环境检测
// ============================================

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
export const isSandbox = process.env.COZE_PROJECT_ENV === 'DEV';

// ============================================
// 数据库配置
// ============================================

/**
 * PostgreSQL 数据库连接 URL
 * 
 * 格式：postgresql://用户名:密码@主机:端口/数据库名
 * 
 * 沙箱环境：在 Coze 平台配置 PGDATABASE_URL
 * 生产环境：在服务器 .env.local 中配置
 */
export const DATABASE_URL = process.env.PGDATABASE_URL || process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.warn('[ENV] 数据库连接未配置，请设置 PGDATABASE_URL 或 DATABASE_URL');
}

// ============================================
// 对象存储配置
// ============================================

/**
 * 腾讯云 COS 存储配置（统一使用）
 */
export const STORAGE_CONFIG = {
  // 存储桶名称
  bucket: process.env.COZE_BUCKET_NAME || 'tianzhi-1314611801',
  
  // 地域
  region: process.env.COZE_BUCKET_REGION || 'ap-beijing',
  
  // 访问域名（用于拼接图片 URL）
  cdnDomain: process.env.CDN_DOMAIN || 'tianzhi-1314611801.cos.ap-beijing.myqcloud.com',
  
  // 是否配置了存储认证
  hasCredentials: !!process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
};

/**
 * 生成 COS 图片完整 URL
 */
export function getCosImageUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `https://${STORAGE_CONFIG.cdnDomain}/${key}`;
}

// ============================================
// API 配置
// ============================================

/**
 * 后端服务配置
 */
export const API_CONFIG = {
  // 后端服务地址（BFF 调用）
  backendURL: process.env.BACKEND_URL || 'http://localhost:5001',
  
  // API 超时时间
  timeout: 10000,
};

/**
 * 前端公开的 API 地址
 */
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================
// 安全配置
// ============================================

/**
 * JWT 密钥
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'chemicaloop-default-secret-change-in-production';

if (isProd && JWT_SECRET === 'chemicaloop-default-secret-change-in-production') {
  console.warn('[ENV] 生产环境请配置安全的 JWT_SECRET');
}

// ============================================
// AI 服务配置（可选）
// ============================================

/**
 * Coze AI API Key（用于图片生成等）
 */
export const COZE_API_KEY = process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '';

/**
 * 是否启用 AI 功能
 */
export const hasAiCapabilities = !!COZE_API_KEY;

// ============================================
// 功能开关
// ============================================

export const FEATURE_FLAGS = {
  // 是否启用图片签名（需要 COZE_WORKLOAD_IDENTITY_API_KEY）
  enableImageSigning: STORAGE_CONFIG.hasCredentials,
  
  // 是否启用 AI 功能
  enableAI: hasAiCapabilities,
  
  // 调试模式
  debug: isDev || isSandbox,
};

// ============================================
// 日志
// ============================================

if (FEATURE_FLAGS.debug) {
  console.log('[ENV] 环境配置:', {
    isDev,
    isProd,
    isSandbox,
    hasDatabase: !!DATABASE_URL,
    hasStorage: STORAGE_CONFIG.hasCredentials,
    hasAI: hasAiCapabilities,
  });
}
