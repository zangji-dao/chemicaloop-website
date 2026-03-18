/**
 * 应用配置
 * 包含 API 配置、Banner 配置等
 */

// ============================================
// API 配置
// ============================================

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

// ============================================
// Banner 配置
// ============================================

/**
 * Banner 图片配置
 *
 * 使用方法：
 * 1. 运行 pnpm list-banners 查看对象存储中的图片
 * 2. 将生成的 URL 配置到下面的数组中
 * 3. 重新启动开发服务器
 */

export const bannerConfig = {
  // 单张 banner 图片（如果只有一张）
  singleBannerUrl: "",

  // 多张轮播 banner 图片（腾讯云 COS）
  carouselBanners: [
    "https://tianzhi-1314611801.cos.ap-beijing.myqcloud.com/chemicaloop/banners/home-banner1.jpg",
    "https://tianzhi-1314611801.cos.ap-beijing.myqcloud.com/chemicaloop/banners/home-banner2.jpg",
  ],

  // 轮播配置
  carousel: {
    autoPlay: true,          // 是否自动播放
    interval: 5000,          // 轮播间隔（毫秒）
    showDots: true,          // 是否显示指示点
    showArrows: true,        // 是否显示左右箭头
  },

  // 当前使用的模式：'single' | 'carousel'
  mode: 'carousel' as 'single' | 'carousel',
};

/**
 * 获取 banner 图片的辅助函数
 */
export function getBannerImages(): string[] {
  if (bannerConfig.mode === 'single' && bannerConfig.singleBannerUrl) {
    return [bannerConfig.singleBannerUrl];
  }
  if (bannerConfig.mode === 'carousel' && bannerConfig.carouselBanners.length > 0) {
    return bannerConfig.carouselBanners;
  }
  return [];
}
