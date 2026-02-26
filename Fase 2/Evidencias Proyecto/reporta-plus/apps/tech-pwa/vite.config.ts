import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-reporta-plus.png'],
      manifest: {
        name: 'Reporta+',
        short_name: 'Reporta+',
        description: 'Aplicación móvil para técnicos de Reporta+',
        theme_color: '#F07020',
        background_color: '#05060A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'logo-reporta-plus.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-reporta-plus.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo-reporta-plus.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
})
