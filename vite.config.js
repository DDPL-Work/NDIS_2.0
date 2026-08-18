import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The published backend does not send CORS headers, so the dev server proxies
// /api to it.  Enable it by setting VITE_API_BASE_URL=/api in .env.development.local.
const PROXY_TARGET = 'https://nalanda.drdesigntech.com'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
})
