/**
 * 环境变量统一管理
 * 
 * 敏感信息通过 .env.local 配置（不上传 GitHub）
 * 公开配置通过 .env 配置（可上传）
 * 
 * 环境变量优先级：
 * 1. .env.local（本地/生产环境，敏感信息）
 * 2. .env（默认配置，可上传）
 * 3. 系统环境变量
 * 4. 代码中的默认值
 * 
 * ============================================
 * 生产环境配置说明（docs/production-config.md）
 * ============================================
 * 
 * 生产环境部署时需要配置以下环境变量：
 * 
 * 1. 数据库（腾讯云 PostgreSQL）
 *    - PGDATABASE_URL=postgresql://chemicaloop_user:Chemicaloop2024@152.136.12.122:5432/chemicaloop?sslmode=disable
 *    
 * 2. 对象存储（腾讯云 COS）
 *    - S3_ACCESS_KEY_ID=<腾讯云 AccessKey>
 *    - S3_SECRET_ACCESS_KEY=<腾讯云 SecretKey>
 *    - BUCKET_NAME=tianzhi-1314611801
 *    - BUCKET_REGION=ap-beijing
 *    - BUCKET_ENDPOINT_URL=https://cos.ap-beijing.myqcloud.com
 *    
 * 3. 安全配置
 *    - JWT_SECRET=<安全的密钥>
 *    
 * 4. AI 服务（可选）
 *    - COZE_WORKLOAD_IDENTITY_API_KEY=<Coze API Key>
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
 * 沙箱环境：使用系统提供的火山引擎数据库（PGDATABASE_URL）
 * 生产环境：配置腾讯云 PostgreSQL 数据库
 */
export const DATABASE_URL = process.env.PGDATABASE_URL || process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.warn('[ENV] 数据库连接未配置，请设置 PGDATABASE_URL 或 DATABASE_URL');
}

// ============================================
// 对象存储配置
// ============================================

/**
 * 对象存储配置
 * 
 * 沙箱环境：使用系统提供的对象存储（通过 COZE_BUCKET_* 环境变量）
 * 生产环境：使用腾讯云 COS
 */
export const STORAGE_CONFIG = {
  // 存储桶名称
  bucket: process.env.COZE_BUCKET_NAME || process.env.BUCKET_NAME || '',
  
  // 地域
  region: process.env.COZE_BUCKET_REGION || process.env.BUCKET_REGION || '',
  
  // Endpoint URL（用于 S3 SDK）
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL || process.env.BUCKET_ENDPOINT_URL || '',
  
  // CDN 域名（公共访问）- 沙箱环境使用系统域名，生产环境使用腾讯云 COS
  cdnDomain: process.env.COZE_BUCKET_DOMAIN || process.env.BUCKET_CDN_DOMAIN || '',
};

/**
 * 对象存储凭证
 * 
 * 沙箱环境：使用系统提供的临时凭证
 * 生产环境：使用腾讯云 COS 密钥
 */
export const STORAGE_CREDENTIALS = {
  accessKeyId: process.env.COZE_BUCKET_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.COZE_BUCKET_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '',
  sessionToken: process.env.COZE_BUCKET_SESSION_TOKEN || '',
};

/**
 * 检查对象存储是否可用
 */
export const hasStorage = !!STORAGE_CONFIG.bucket && !!STORAGE_CREDENTIALS.accessKeyId;

/**
 * 生成对象存储图片完整 URL
 */
export function getStorageImageUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  if (STORAGE_CONFIG.cdnDomain) {
    return `https://${STORAGE_CONFIG.cdnDomain}/${key}`;
  }
  
  // fallback: 使用 endpoint 拼接
  if (STORAGE_CONFIG.endpointUrl && STORAGE_CONFIG.bucket) {
    return `${STORAGE_CONFIG.endpointUrl}/${STORAGE_CONFIG.bucket}/${key}`;
  }
  
  return key;
}

// ============================================
// 生产环境专用配置（腾讯云 COS）
// ============================================

/**
 * 腾讯云 COS 配置（生产环境使用）
 * 
 * 注意：沙箱环境不要使用此配置，使用上面的 STORAGE_CONFIG
 */
export const COS_CONFIG = {
  bucket: 'tianzhi-1314611801',
  region: 'ap-beijing',
  cdnDomain: 'tianzhi-1314611801.cos.ap-beijing.myqcloud.com',
};

export const COS_CREDENTIALS = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
};

/**
 * 生成腾讯云 COS 图片完整 URL（生产环境）
 */
export function getCosImageUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `https://${COS_CONFIG.cdnDomain}/${key}`;
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
  // 调试模式
  debug: isDev || isSandbox,
  
  // 是否启用 AI 功能
  enableAI: hasAiCapabilities,
  
  // 是否有对象存储
  hasStorage,
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
    storageBucket: STORAGE_CONFIG.bucket || '(not configured)',
    hasStorage,
    hasAI: hasAiCapabilities,
  });
}
