export const API_CONFIG = {
  /**
   * 后端服务地址（不带 /api 后缀）
   * 用于 API Routes 转发请求到后端
   */
  backendURL: process.env.BACKEND_URL || 'http://localhost:3001',
  
  /**
   * API 基础地址（带 /api 后缀）
   * 用于 axios 等客户端直接请求
   */
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  
  timeout: 10000,
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
