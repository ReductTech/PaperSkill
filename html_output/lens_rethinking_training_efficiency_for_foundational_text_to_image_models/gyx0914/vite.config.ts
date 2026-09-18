import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// paper-skill generated tutorial. Static assets are bundled with the project.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, open: false },
  build: { outDir: 'dist', sourcemap: false },
});
