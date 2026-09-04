#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, PAPER_NAME_RE } = require('./lib/repository');

const paperName = process.argv[2];
if (!paperName || !PAPER_NAME_RE.test(paperName)) {
  console.error('用法：npm run export:paper -- <paper-name>');
  process.exit(1);
}

const sourceDir = path.join(ROOT, 'site', 'papers', paperName);
const sourceHtml = path.join(sourceDir, 'index.html');
if (!fs.existsSync(sourceHtml)) {
  console.error(`尚未找到构建产物，请先运行：npm run build:paper -- ${paperName}`);
  process.exit(1);
}

let html = fs.readFileSync(sourceHtml, 'utf8');

html = html.replace(/<link\b([^>]*?)href=["']([^"']+\.css)["']([^>]*)>/gi, (tag, before, href) => {
  const file = path.resolve(sourceDir, href);
  if (!file.startsWith(sourceDir + path.sep) || !fs.existsSync(file)) return tag;
  const css = fs.readFileSync(file, 'utf8').replace(/<\/style/gi, '<\\/style');
  return `<style data-inlined-from="${href}">\n${css}\n</style>`;
});

html = html.replace(/<script\b([^>]*?)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi, (tag, before, src) => {
  const file = path.resolve(sourceDir, src);
  if (!file.startsWith(sourceDir + path.sep) || !fs.existsSync(file)) return tag;
  const js = fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script data-inlined-from="${src}">\n${js}\n</script>`;
});

// Vite 的 module 脚本默认延迟执行；转换为普通内联脚本后必须放到 body
// 末尾，确保 React 挂载节点已经完成解析。
const inlineScripts = [];
html = html.replace(/\s*(<script data-inlined-from="[^"]+">[\s\S]*?<\/script>)/gi, (tag, script) => {
  inlineScripts.push(script);
  return '';
});
if (inlineScripts.length > 0) {
  const scriptsAtEnd = `  ${inlineScripts.join('\n  ')}\n  </body>`;
  html = html.replace(/<\/body>/i, () => scriptsAtEnd);
}

const outputDir = path.join(ROOT, 'exports');
const output = path.join(outputDir, `${paperName}.html`);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, html, 'utf8');
console.log(`已生成单文件网页：${path.relative(ROOT, output)}`);
