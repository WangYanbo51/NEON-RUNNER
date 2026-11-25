import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5183,
    strictPort: false,
    host: '127.0.0.1',
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
