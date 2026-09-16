import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// paper-skill generated tutorial. No external CDN; everything is bundled locally.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, open: false, host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
  build: { outDir: 'dist', sourcemap: false },
});
