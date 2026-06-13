import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Deep Read — Vite config.
// Static document pages (protocol, vow, seal-log, about, institute, 404) live in
// public/ and are copied verbatim to dist/ so direct-URL hard-refresh always works.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },
});
