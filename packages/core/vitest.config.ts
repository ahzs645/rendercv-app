import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@rendercv/contracts',
        replacement: path.resolve(__dirname, '../contracts/src/index.ts')
      },
      {
        find: /^@rendercv\/contracts\/(.+)$/,
        replacement: path.resolve(__dirname, '../contracts/src/$1')
      }
    ]
  },
  test: {
    environment: 'node'
  }
});
