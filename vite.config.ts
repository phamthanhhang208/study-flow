import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/search': {
        target: 'https://ydc-index.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, '/v1'),
      },
      '/api/agent': {
        target: 'https://api.you.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agent/, '/v1'),
      },
    },
  },
})
