import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
// 关键修正：改为默认导入（去掉花括号 {}）
import csp from 'vite-plugin-csp'

export default defineConfig({
  plugins: [
    vue(),
    // CSP配置不变，直接调用默认导入的csp函数
    csp({
      directives: {
        'script-src': ["'self'", "'unsafe-eval'"], // 解决eval被阻止的问题（按需保留）
        // 可选：补充其他常用CSP指令（根据项目实际需求添加）
        'style-src': ["'self'", "'unsafe-inline'"], // 允许内联样式（Vue项目常用）
        'img-src': ["'self'", 'data:', 'https:'], // 允许本地、base64、HTTPS图片
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
  },
})
