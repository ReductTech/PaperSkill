import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// paper-skill generated tutorial. No external CDN; everything is bundled locally.
export default defineConfig({
  plugins: [react()],
  base: './',
  // `大学` is a Windows junction that points from C: to D:. Without preserving
  // the visible path, Vite may resolve /src/main.tsx onto D: while its dev-server
  // allow-list still treats the C: path as the project root.
  resolve: { preserveSymlinks: true },
  server: { port: 5173, open: false },
  build: { outDir: 'dist', sourcemap: false },
});
