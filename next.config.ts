import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // 明确指定工作目录，避免检测到多个 pnpm-lock.yaml 警告
  // outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ['*.dev.coze.site'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
  
  async redirects() {
    const redirects = [
      { source: '/', destination: '/en', permanent: false },
    ];

    // 为不带语言前缀的路径创建重定向
    ['messages', 'profile'].forEach(folder => {
      redirects.push(
        { source: `/${folder}`, destination: `/en/${folder}`, permanent: false },
        { source: `/${folder}/:path*`, destination: `/en/${folder}/:path*`, permanent: false }
      );
    });

    return redirects;
  },
  
  async rewrites() {
    return [
      // 转发到后端服务的 API（本地无实现或只是代理）
      { source: '/api/auth/:path*', destination: 'http://localhost:3001/api/auth/:path*' },
      // 注意：/api/admin 路由部分由前端处理（图片生成等），部分转发到后端
      // 以下是需要转发到后端的管理员 API
      { source: '/api/admin/login', destination: 'http://localhost:3001/api/admin/login' },
      { source: '/api/admin/verify', destination: 'http://localhost:3001/api/admin/verify' },
      { source: '/api/admin/users', destination: 'http://localhost:3001/api/admin/users' },
      { source: '/api/admin/users/:path*', destination: 'http://localhost:3001/api/admin/users/:path*' },
      { source: '/api/admin/stats', destination: 'http://localhost:3001/api/admin/stats' },
      // SPU 管理 API - 转发到后端
      // 注意：sync-pubchem、check-pubchem-connection、cleanup、image-url 有前端 BFF 实现
      // Next.js 会优先匹配文件系统路由，然后再应用 rewrites
      { source: '/api/admin/spu', destination: 'http://localhost:3001/api/admin/spu' },
      { source: '/api/admin/spu/search', destination: 'http://localhost:3001/api/admin/spu/search' },
      { source: '/api/admin/spu/save', destination: 'http://localhost:3001/api/admin/spu/save' },
      { source: '/api/admin/spu/:id', destination: 'http://localhost:3001/api/admin/spu/:id' },
      // 产品管理 API 全部由前端处理（不再转发到后端）
      // { source: '/api/admin/products', destination: 'http://localhost:3001/api/admin/products' },
      // { source: '/api/admin/products/stats', destination: 'http://localhost:3001/api/admin/products/stats' },
      // { source: '/api/admin/products/batch-status', destination: 'http://localhost:3001/api/admin/products/batch-status' },
      // { source: '/api/admin/products/:id/status', destination: 'http://localhost:3001/api/admin/products/:id/status' },
      // 其他 API
      { source: '/api/news/:path*', destination: 'http://localhost:3001/api/news/:path*' },
      { source: '/api/profile/:path*', destination: 'http://localhost:3001/api/profile/:path*' },
      { source: '/api/notifications/:path*', destination: 'http://localhost:3001/api/notifications/:path*' },
    ];
  },
};

export default withNextIntl(nextConfig);
