import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Use esbuild for minification (faster and doesn't require terser)
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
      'react-helmet-async',
    ],
  },
  // Enable gzip compression
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      // Ignore files that may be updated by external tools to prevent reload loops
      ignored: [
        '**/dist/**',
        '**/public/sitemap.xml',
        '**/public/robots.txt',
        '**/env.tmp',
        '**/supabase/migrations/**',
      ],
    },
  },
});
