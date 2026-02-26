import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/test/**/*.test.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'api/_lib/**'],
      exclude: ['src/test/**']
    }
  },

  build: {
    target: 'es2020',
    minify: 'terser',
    chunkSizeWarningLimit: 600,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['date-fns', 'framer-motion', 'recharts'],
          'vendor-pdf': ['jspdf', 'html2canvas']
        }
      }
    }
  }
})
