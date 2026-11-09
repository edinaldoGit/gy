import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { readFileSync } from 'node:fs';

const versao = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/gy/' : '/',
  define: { __GY_VERSION__: JSON.stringify(versao) },
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'Fredoka-OFL.txt'],
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,ttf,txt}']
      },
      manifest: {
        name: 'Gy',
        short_name: 'Gy',
        id: './',
        start_url: './',
        scope: './',
        description: 'Organização de treinos e acompanhamento de evolução física.',
        lang: 'pt-BR',
        theme_color: '#FC6471',
        background_color: '#F1EDEE',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  }
}));
