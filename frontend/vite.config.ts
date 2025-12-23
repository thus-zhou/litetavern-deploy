import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'LiteTavern Pro',
        short_name: 'LiteTavern',
        description: 'Professional AI Roleplay Client',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
      rollupOptions: {
          output: {
              manualChunks: {
                  vendor: ['react', 'react-dom', 'zustand', 'immer', 'clsx'],
                  ui: ['lucide-react', 'react-markdown', 'framer-motion'],
                  auth: ['./src/components/auth/LoginScreen', './src/components/auth/AdminDashboard'],
                  chat: ['./src/components/chat/ChatView', './src/components/chat/ChatInput'],
              }
          }
      },
      chunkSizeWarningLimit: 1000
  }
})
