import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// paper-skill generated tutorial. No external CDN; everything is bundled locally.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'github-pages' ? '/PaperSkill/' : './',
  server: { port: 5173, open: false },
  build: { outDir: 'dist', sourcemap: false },
}));
