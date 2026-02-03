import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// PWA disabled for native iOS build
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA disabled - not needed for Capacitor iOS
    /*
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'delulu - Connect in the Clouds',
        short_name: 'delulu',
        description: 'Hyperlokale Community für echte Begegnungen',
        theme_color: '#A084E8',
        background_color: '#F9F9F9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
    */
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
