import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const scripts = [];
const readAsset = relative => {
  const resolved = path.resolve(dist, relative);
  if (!resolved.startsWith(dist + path.sep)) throw new Error('Asset outside build directory');
  return fs.readFileSync(resolved, 'utf8');
};
html = html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g, (_, src) =>
  `<style>${readAsset(src).replace(/<\/style/gi, '<\\/style')}</style>`);
html = html.replace(/<script\b[^>]*src="([^"]+\.js)"[^>]*><\/script>/g, (_, src) => {
  scripts.push(`<script>${readAsset(src).replace(/<\/script/gi, '<\\/script')}</script>`);
  return '';
});
html = html.replace('</body>', () => `${scripts.join('\n')}\n</body>`);
if (/<script\b[^>]*\bsrc=|<link\b[^>]*rel="(?:stylesheet|modulepreload)"/i.test(html)) {
  throw new Error('Export still depends on external script or stylesheet');
}
const out = path.join(root, '打开导读.html');
fs.writeFileSync(out, html);
console.log(`单文件导出完成：${out} (${Buffer.byteLength(html)} bytes)`);
