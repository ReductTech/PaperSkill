// Keep the distributable HTML directly openable under file://.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'dist';
let html = await readFile(join(dir, 'index.html'), 'utf8');
for (const match of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)) {
  const css = await readFile(join(dir, match[1]), 'utf8');
  html = html.replace(match[0], () => '<style>' + css + '</style>');
}
for (const match of html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)) {
  const js = (await readFile(join(dir, match[1]), 'utf8')).replace(/<\/script/gi, '<\\/script');
  html = html.replace(match[0], () => '<script type="module">' + js + '</script>');
}
await writeFile(join(dir, 'index.html'), html);
