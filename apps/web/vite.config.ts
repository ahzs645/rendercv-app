/// <reference types="vitest/config" />

import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rendercv-app/',
  publicDir: '../../static',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      {
        find: '@rendercv/contracts',
        replacement: path.resolve(__dirname, '../../packages/contracts/src/index.ts')
      },
      {
        find: '@rendercv/core',
        replacement: path.resolve(__dirname, '../../packages/core/src/index.ts')
      },
      {
        find: /^@rendercv\/contracts\/(.+)$/,
        replacement: path.resolve(__dirname, '../../packages/contracts/src/$1')
      },
      {
        find: /^@rendercv\/core\/(.+)$/,
        replacement: path.resolve(__dirname, '../../packages/core/src/$1')
      }
    ]
  },
  server: {
    fs: {
      allow: ['../..']
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
