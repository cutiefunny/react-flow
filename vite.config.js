import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api/proxy'로 시작하는 모든 요청을 target으로 전달합니다.
      '/api/proxy': {
        target: 'http://202.20.84.65:8083',
        // cross-origin 요청을 위해 필수로 추가해야 합니다.
        changeOrigin: true,
        // 요청 경로에서 '/api/proxy'를 '/api/v1'으로 올바르게 변경합니다.
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/api/v1'),
      },
      '/api/random-word': {
        target: 'https://random-word-api.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/random-word/, ''),
      },
    },
  },
})