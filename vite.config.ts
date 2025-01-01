import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@google/model-viewer'],
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'model-viewer': ['@google/model-viewer'],
        },
      },
    },
  },
});
