import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { csp } from 'vite-plugin-csp' // 引入CSP插件

export default defineConfig({
  plugins: [
    vue(),
    // 添加CSP配置（解决eval被阻止的问题）
    csp({
      directives: {
        'script-src': ["'self'", "'unsafe-eval'"], // 允许self和unsafe-eval（按需添加）
        // 可根据项目需求补充其他CSP指令（如style-src、img-src等）
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
