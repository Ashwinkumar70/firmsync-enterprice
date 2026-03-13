import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/firmsync-enterprice/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-recharts': ['recharts'],
          'vendor-utils': ['date-fns', 'lucide-react', 'zod', '@hookform/resolvers']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
