/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/
  base: process.env.VITE_BASE ?? '/familygame/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trò chơi gia đình',
        short_name: 'Gia đình',
        description: 'Tìm số, cờ ca rô — chơi một mình hoặc với bạn',
        lang: 'vi',
        theme_color: '#ffb703',
        background_color: '#fff8e7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,png}',
          '**/*nunito-{latin,latin-ext,vietnamese}-*-normal.woff2',
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
});
