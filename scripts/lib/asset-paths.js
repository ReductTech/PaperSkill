'use strict';

/**
 * 教程资源路径检查（供 scripts/validate-repository.js 调用，本身不是命令）。
 *
 * 背景：教程部署在仓库子路径下（…/papers/<paper>/<version>/）。Vite 只会自动改写 HTML 属性
 * 和 CSS url()，JS/JSX/TS/TSX 字符串里的 /images/x.png 会原样保留 → 浏览器去站点根找 → 404。
 * 正确写法是 ./images/x.png。
 */

const fs = require('fs');
const path = require('path');

// 视为「本地资源」的扩展名；其余路径（无扩展名的路由、接口）不检查
const ASSET_EXT = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico', 'apng',
  'mp4', 'webm', 'mov', 'm4v', 'ogv', 'mp3', 'wav', 'ogg', 'm4a', 'aac',
  'pdf', 'json', 'csv', 'txt', 'zip', 'glb', 'gltf', 'obj', 'fbx', 'exr', 'hdr',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
]);
const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ssr', '.npm-cache', '.git', '.vite']);

/** JS/TS 字符串里的根绝对路径（含模板字符串） */
const JS_STRING_RE = /(["'`])(\/[A-Za-z0-9._@%+~/-]+)\1/g;
/** CSS 属性选择器，如 img[src='/images/x.png']；url() 由 Vite 正确处理，不检查 */
const CSS_SELECTOR_RE = /\[[a-zA-Z-]+\s*=\s*(["'])(\/[A-Za-z0-9._@%+~/-]+)\1\]/g;

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** ok=public 下有对应文件；missing=像资源但文件缺失；not-asset=不像本地资源；external=外链 */
function assetState(versionDir, ref) {
  const clean = ref.split(/[?#]/)[0];
  if (ref.startsWith('//') || clean.includes('://')) return 'external';
  const relative = clean.replace(/^\/+/, '');
  // /、/#anchor、/images/ 这类不是「具体文件」的引用不检查
  if (!relative || clean.endsWith('/')) return 'not-asset';
  const ext = path.extname(clean).slice(1).toLowerCase();
  if (fs.existsSync(path.join(versionDir, 'public', relative))) return 'ok';
  return ASSET_EXT.has(ext) ? 'missing' : 'not-asset';
}

/**
 * 扫描一个版本目录，返回其中的根绝对资源引用。
 * @returns {{file: string, line: number, ref: string, missing: boolean}[]} file 为相对版本目录的路径
 */
function scanVersion(versionDir) {
  const findings = [];
  for (const file of walk(path.join(versionDir, 'src'))) {
    const ext = path.extname(file).toLowerCase();
    const isCode = CODE_EXT.has(ext);
    const isCss = ext === '.css';
    if (!isCode && !isCss) continue;
    const text = fs.readFileSync(file, 'utf8');
    const re = isCode ? JS_STRING_RE : CSS_SELECTOR_RE;
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const ref = match[2];
      const state = assetState(versionDir, ref);
      if (state === 'not-asset' || state === 'external') continue;
      findings.push({
        file: path.relative(versionDir, file).replace(/\\/g, '/'),
        line: text.slice(0, match.index).split('\n').length,
        ref,
        missing: state === 'missing',
      });
    }
  }
  return findings;
}

module.exports = { scanVersion };
