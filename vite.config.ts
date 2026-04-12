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
          'vendor-icons': ['lucide-react'],
          'vendor-forms': ['zod', '@hookform/resolvers', 'react-hook-form'],
          'vendor-utils': ['date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
