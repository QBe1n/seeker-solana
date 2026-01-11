import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Seeker - Solana Talent Matching',
        short_name: 'Seeker',
        theme_color: '#9945FF',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait'
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});