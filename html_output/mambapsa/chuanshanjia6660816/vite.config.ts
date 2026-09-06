import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// onnxruntime-web 打包时会把它的 jsep.wasm 当静态资源自动输出一份（带 hash）。
// 浏览器运行时实际走 public/wasm/ 下的自托管拷贝（web-infer 里 wasmPaths 已指向），
// 这份是死重（约 27 MB），构建完成后删掉，避免拖垮 GitHub Pages 站点体积。
function dropOrtDeadWasm() {
  return {
    name: 'drop-ort-dead-wasm',
    closeBundle() {
      const assets = fileURLToPath(new URL('./dist/assets', import.meta.url));
      for (const f of readdirSync(assets)) {
        if (/^ort-wasm-simd-threaded\.jsep-[a-zA-Z0-9_]+\.wasm$/.test(f)) {
          unlinkSync(`${assets}/${f}`);
          console.log('[vite] dropped dead onnxruntime-web wasm:', f);
        }
      }
    },
  };
}

// paper-skill generated tutorial. No external CDN; everything is bundled locally.
export default defineConfig({
  plugins: [react(), dropOrtDeadWasm()],
  base: './',
  server: { port: 5173, open: false },
  build: { outDir: 'dist', sourcemap: false },
});
