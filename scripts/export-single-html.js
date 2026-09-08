#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, PAPER_NAME_RE, VERSION_NAME_RE, findPaper, listVersions, catalogRecords } = require('./lib/repository');

function usage() {
  console.error('用法：npm run export:paper -- <paper-name>[/<version>]');
  process.exit(1);
}

const target = process.argv[2];
if (!target) usage();
const [paperName, requestedVersion] = target.split('/');
if (!PAPER_NAME_RE.test(paperName)) usage();
if (requestedVersion && !VERSION_NAME_RE.test(requestedVersion)) usage();

const paper = findPaper(paperName);
if (!paper) {
  console.error(`论文目录不存在：html_output/${paperName}`);
  process.exit(1);
}
const versions = listVersions(paper);
if (versions.length === 0) {
  console.error(`论文 ${paperName} 下没有版本目录`);
  process.exit(1);
}

// 未指定版本时导出集合站使用的主版本（已发布优先，其次修改日期最新）
let version = requestedVersion;
if (!version) {
  const record = catalogRecords().find((item) => item.paperName === paperName);
  const primary = record?.versions?.slice().sort((a, b) => {
    if ((a.status === 'published') !== (b.status === 'published')) return a.status === 'published' ? -1 : 1;
    if ((a.versionDate || '') !== (b.versionDate || '')) return (b.versionDate || '').localeCompare(a.versionDate || '');
    return b.version.localeCompare(a.version);
  })[0];
  version = primary?.version || versions[versions.length - 1].version;
  console.log(`未指定版本，导出主版本：${version}`);
}

const sourceDir = path.join(ROOT, 'site', 'papers', paperName, version);
const sourceHtml = path.join(sourceDir, 'index.html');
if (!fs.existsSync(sourceHtml)) {
  console.error(`尚未找到构建产物，请先运行：npm run build:paper -- ${paperName}/${version}`);
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

const outputDir = path.join(ROOT, 'exports', paperName);
const output = path.join(outputDir, `${version}.html`);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, html, 'utf8');
console.log(`已生成单文件网页：${path.relative(ROOT, output)}`);
