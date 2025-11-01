import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7177',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
