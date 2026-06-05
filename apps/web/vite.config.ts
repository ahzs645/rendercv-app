/// <reference types="vitest/config" />

import { execSync } from 'node:child_process';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

function getBuildVersion(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return Date.now().toString(36);
  }
}

const BUILD_VERSION = getBuildVersion();
const BUILD_TIME = new Date().toISOString();
const VERSION_JSON = JSON.stringify(
  { version: '0.1.0', buildNumber: BUILD_VERSION, buildTime: BUILD_TIME },
  null,
  2
);

function versionJsonPlugin(): Plugin {
  return {
    name: 'rendercv-version-json',
    apply: () => true,
    configureServer(server) {
      server.middlewares.use('/rendercv-app/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(VERSION_JSON);
      });
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(VERSION_JSON);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: VERSION_JSON
      });
    }
  };
}

export default defineConfig({
  base: '/rendercv-app/',
  publicDir: '../../static',
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME)
  },
  plugins: [tailwindcss(), react(), versionJsonPlugin()],
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
