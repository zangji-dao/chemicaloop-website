import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    hmr: {
      port: 5000,
      protocol: 'ws',
      host: '0.0.0.0',
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
})
