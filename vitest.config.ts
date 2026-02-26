import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '~': path.resolve(__dirname, './src') },
  },
  test: {
    // Default to node; component tests override with @vitest-environment jsdom
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
});
