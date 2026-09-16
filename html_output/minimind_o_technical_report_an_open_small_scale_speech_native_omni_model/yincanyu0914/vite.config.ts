import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// paper-skill generated tutorial. No external CDN; everything is bundled locally.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, open: false, proxy: { '/api/tutor': 'http://127.0.0.1:5174' } },
  build: { outDir: 'dist', sourcemap: false },
});
