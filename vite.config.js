import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['date-fns', 'lucide-react', 'framer-motion']
        }
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    }
  }
})
