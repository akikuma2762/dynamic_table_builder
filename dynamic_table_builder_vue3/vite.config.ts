import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 82,
    proxy: {
      '/api': {
        target: 'http://localhost:5048',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
