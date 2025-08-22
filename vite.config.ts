import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default defineConfig(
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  })
);