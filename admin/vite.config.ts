import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      '5173-iwj5dbh9nnq3ssivguww6-600abe6b.sg1.manus.computer',
      '5173-it7ta2adqtkw4849dlmp9-40161be1.sg1.manus.computer',
      'localhost',
      '127.0.0.1',
      '.sg1.manus.computer',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
