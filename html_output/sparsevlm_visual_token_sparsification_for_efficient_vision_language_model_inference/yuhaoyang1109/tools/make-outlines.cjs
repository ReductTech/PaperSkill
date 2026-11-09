// 从 src/data/tutorial.ts 生成 outlines.json（格式同 VTW v7.3：title + pages[]，每页 id、chapterId、title、goal、summary、interaction、next、snippet）。
// 用法：node tools/make-outlines.cjs
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const root = path.join(__dirname, '..');
const out = esbuild.buildSync({ entryPoints: [path.join(root, 'src/data/tutorial.ts')], bundle: true, write: false, format: 'cjs', platform: 'node' });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const t = mod.exports.tutorial;
const pages = t.chapters.flatMap((c) =>
  c.scenes.map((s) => ({ id: s.id, chapterId: c.id, title: s.title, goal: s.goal, summary: s.summary, interaction: s.interaction, next: s.next, snippet: s.notes }))
);
fs.writeFileSync(path.join(root, 'outlines.json'), JSON.stringify({ title: `SparseVLM：${t.meta.titleZh}`, pages }, null, 2) + '\n');
console.log(`outlines.json: ${pages.length} pages`);
