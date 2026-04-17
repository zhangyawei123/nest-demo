import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 轻微上调告警阈值，同时通过 manualChunks 拆分大依赖
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'vendor-element-plus'
          if (id.includes('echarts') || id.includes('zrender')) return 'vendor-echarts'
          if (id.includes('@wangeditor')) return 'vendor-wangeditor'
          if (id.includes('html2canvas')) return 'vendor-html2canvas'
          if (id.includes('qrcode') || id.includes('jsqr')) return 'vendor-qrcode'
          if (id.includes('vue-router') || id.includes('pinia') || /node_modules\/(@vue|vue)\//.test(id)) return 'vendor-vue'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
