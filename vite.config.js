import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api/spark': {
        target: 'https://spark-api-open.xf-yun.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spark/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  optimizeDeps: {
    include: ['crypto-js']
  },
  build: {
    rollupOptions: {
      external: [/\.(png|jpe?g|gif|svg|ico)$/i],
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT' && /\.(png|jpe?g|gif|svg|ico)$/i.test(warning.source)) {
          return
        }
        warn(warning)
      }
    }
  }
}) 