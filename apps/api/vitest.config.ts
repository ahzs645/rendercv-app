import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
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
  test: {
    environment: 'node'
  }
});
