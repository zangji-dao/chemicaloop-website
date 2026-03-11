/**
 * Banner 图片配置
 *
 * 使用方法：
 * 1. 运行 pnpm list-banners 查看对象存储中的图片
 * 2. 将生成的 URL 配置到下面的数组中
 * 3. 重新启动开发服务器
 */

// Banner 图片配置
export const bannerConfig = {
  // 单张 banner 图片（如果只有一张）
  singleBannerUrl: "",

  // 多张轮播 banner 图片（如果有多张）
  carouselBanners: [
    "https://coze-coding-project.tos.coze.site/coze_storage_7603409097601417250/home-banner1.jpg?sign=1801896543-ad6492474a-0-243f95e6ce20efadbd2a3aa0dd05100ad5035f4fcdd4e2c8d69c2be65826f1b8",
    "https://coze-coding-project.tos.coze.site/coze_storage_7603409097601417250/home-banner2.jpg?sign=1801896543-54e9a0537d-0-0b6a734c3863f25c98d7c15b0ee38dfc566e2537d99b8ae7fc31ae8d125759a7",
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

// 获取 banner 图片的辅助函数
export function getBannerImages(): string[] {
  if (bannerConfig.mode === 'single' && bannerConfig.singleBannerUrl) {
    return [bannerConfig.singleBannerUrl];
  }
  if (bannerConfig.mode === 'carousel' && bannerConfig.carouselBanners.length > 0) {
    return bannerConfig.carouselBanners;
  }
  return [];
}
