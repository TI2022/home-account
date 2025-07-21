/// <reference types="vitest/config" />
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連を分離
          'react-vendor': ['react', 'react-dom'],
          // ルーティング関連を分離
          'router-vendor': ['react-router-dom'],
          // UIライブラリを分離
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // チャート関連を分離
          'chart-vendor': ['recharts'],
          // 仮想化ライブラリを分離
          'virtual-vendor': ['@tanstack/react-virtual', 'react-window'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 警告閾値を調整
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});