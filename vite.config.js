import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    compression(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: false, // usando manifest.json manual em /public
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Limitar tamanho do cache
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 min
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    // Configuração para evitar problemas de CORS em dev
    cors: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Minificação otimizada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log em produção
        drop_debugger: true, // Remove debugger
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true, // Compatibilidade com Safari 10
      },
    },
    // Limite de warning reduzido para detectar chunks pesados mais cedo
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Chunk splitting manual — carregamento sob demanda por rota
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-ui': ['framer-motion'],
          'vendor-utils': ['date-fns', 'papaparse', 'dompurify'],
          // Bibliotecas de PDF isoladas — só carregam quando usuário acessa Relatórios
          'vendor-pdf': ['jspdf', 'html2canvas'],
        },
      },
    },
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    exclude: ['@anthropic-ai/sdk'], // Evita problemas de SSR
  },
  // Resolver aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },
});
