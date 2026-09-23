#!/usr/bin/env node
'use strict';

/**
 * 修改已有的网页：把 html_output/<paper>/<版本> 复制成同一篇论文下的新版本目录，
 * 并自动生成新的 paper.json（含版本溯源字段 ancestors）。
 * 本命令只做复制与元数据生成，不做校验、不做构建，复制完成后由使用者自行修改网页内容。
 */

const fs = require('fs');
const path = require('path');
const { ROOT, OUTPUT_ROOT, PAPER_NAME_RE, VERSION_NAME_RE } = require('./lib/repository');

const USAGE = [
  '用法: npm run modify -- <已有网页的相对路径> --participant "展示名" --github "用户名" [--jianlun-id "减论完整账号ID"] [--pinyin "lilei"] [--date 0922] [--version lilei0922] [--force]',
  '示例: npm run modify -- html_output/attention_is_all_you_need/tianaopang0913 --participant "李雷" --github "lilei" --pinyin "lilei"',
  '说明: 复制为 html_output/<论文名>/<新版本>，新版本名 = 姓名拼音小写 + 修改日期 MMDD（同一天重复执行自动追加 _2）。',
].join('\n');

function usage() {
  console.error(USAGE);
  process.exit(2);
}

function options(tokens) {
  const result = {};
  for (let i = 0; i < tokens.length; i += 2) {
    if (!tokens[i].startsWith('--') || tokens[i + 1] === undefined) usage();
    result[tokens[i].slice(2)] = tokens[i + 1];
  }
  return result;
}

/** 复制网页工程：跳过依赖、构建产物、npm 缓存与旧元数据 */
function copyProject(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'dist-ssr', '.npm-cache', '.git', 'paper.json'].includes(entry.name)) continue;
    const src = path.join(source, entry.name);
    const dest = path.join(target, entry.name);
    if (entry.isDirectory()) copyProject(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

/** 姓名拼音小写：--pinyin > 英文展示名 > GitHub 用户名；中文姓名必须显式提供 --pinyin */
function pinyinSlug(opts) {
  if (opts.pinyin) {
    const slug = String(opts.pinyin).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!slug) throw new Error('--pinyin 必须包含字母或数字');
    return slug;
  }
  const ascii = String(opts.participant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ascii && /^[a-z]/.test(ascii)) return ascii;
  if (opts.github) {
    const fromGithub = String(opts.github).replace(/^@/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fromGithub) return fromGithub;
  }
  throw new Error('无法确定姓名拼音：请使用 --pinyin "lilei" 指定（中文姓名无法自动转换）');
}

/** 日期：--date 支持 MMDD 或 YYYY-MM-DD，缺省取当天 */
function resolveDate(opts) {
  const now = new Date();
  if (!opts.date) {
    return {
      stamp: `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
      iso: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    };
  }
  const raw = String(opts.date).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { stamp: raw.slice(5).replace('-', ''), iso: raw };
  if (/^\d{4}$/.test(raw)) {
    const month = raw.slice(0, 2);
    const day = raw.slice(2);
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) throw new Error('--date 不是合法日期（MMDD 或 YYYY-MM-DD）');
    return { stamp: raw, iso: `${now.getFullYear()}-${month}-${day}` };
  }
  throw new Error('--date 必须是 MMDD（例如 0922）或 YYYY-MM-DD');
}

/** 版本目录名：pinyin + MMDD；同一人同一天重复修改追加 _2、_3 */
function resolveVersion(paperDir, base) {
  if (!fs.existsSync(path.join(paperDir, base))) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!fs.existsSync(path.join(paperDir, candidate))) return candidate;
  }
  throw new Error(`版本过多：${base}`);
}

/**
 * 溯源链 ancestors：被复制版本自己的 ancestors + 该版本的作者（participants），按时间顺序排列。
 * 被复制版本没有 ancestors 时，说明它本身就是初始版本，于是它的作者成为第一个原创者。
 * 唯一键是**版本目录名**（同一版本只记一条；版本号缺失时才退回 github）；同 key 时**追加项优先**，
 * 不会被源数据里同版本的旧记录覆盖。每条记录只存 github 与 version——展示名可由门户从那一版元数据里查到，无需冗余存储。
 */
function buildAncestors(meta, sourceVersion) {
  const chain = [
    ...(Array.isArray(meta.ancestors) ? meta.ancestors : []).map((item) => ({ item })),
    ...(Array.isArray(meta.participants) ? meta.participants : []).map((item) => ({ item, version: sourceVersion })),
  ];
  const byKey = new Map();
  for (const { item, version } of chain) {
    if (!item) continue;
    const github = String(item.github || '').replace(/^@/, '').trim();
    const versionName = String(item.version || version || '').trim();
    const key = (versionName || github).toLowerCase();
    if (!key) continue;
    const entry = {};
    if (github) entry.github = github;
    if (versionName) entry.version = versionName;
    // Map 覆盖同 key 时保持原有位置：顺序不变，内容以追加项为准
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}

/** 仅用于命令输出：作者行会带展示名（participants 里有），溯源行只有 github 与版本 */
function describe(list) {
  return list.map((item) => [item.name, item.github, item.version].filter(Boolean).join(' · ') || '未填写').join(' → ');
}

const [sourceArg, ...rest] = process.argv.slice(2);
if (!sourceArg) usage();
const opts = options(rest);
if (!opts.participant) throw new Error('缺少 --participant（公开展示名）');

const cleaned = String(sourceArg).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^html_output\//i, '').replace(/\/+$/, '');
const parts = cleaned.split('/').filter(Boolean);
if (parts.length !== 2) throw new Error('请传入已有网页的相对路径，例如 html_output/attention_is_all_you_need/tianaopang0913');
const [paperName, sourceVersion] = parts;
if (!PAPER_NAME_RE.test(paperName)) throw new Error(`论文目录名不合法：${paperName}（应为论文全称小写加下划线）`);
if (!VERSION_NAME_RE.test(sourceVersion)) throw new Error(`版本目录名不合法：${sourceVersion}`);

const paperDir = path.join(OUTPUT_ROOT, paperName);
const source = path.join(paperDir, sourceVersion);
if (!fs.existsSync(path.join(source, 'paper.json'))) throw new Error(`找不到要修改的网页版本：${path.relative(ROOT, source)}`);
const sourceMeta = JSON.parse(fs.readFileSync(path.join(source, 'paper.json'), 'utf8'));

const date = resolveDate(opts);
const version = opts.version ? String(opts.version).trim() : resolveVersion(paperDir, `${pinyinSlug(opts)}${date.stamp}`);
if (!VERSION_NAME_RE.test(version)) throw new Error('版本目录名必须是姓名拼音小写加修改日期，例如 lilei0922');
const target = path.join(paperDir, version);
if (fs.existsSync(target) && !opts.force) {
  throw new Error(`版本已存在：${path.relative(ROOT, target)}（同一天再次修改会自动生成新版本，或加 --force 覆盖）`);
}

copyProject(source, target);

const participant = { name: opts.participant };
if (opts.github) participant.github = String(opts.github).replace(/^@/, '');
const jianlunId = String(opts['jianlun-id'] || '').trim();
if (jianlunId) participant.jianlunId = jianlunId;
const ancestors = buildAncestors(sourceMeta, sourceVersion);
const meta = { ...sourceMeta, participants: [participant], status: 'review', version, versionDate: date.iso };
if (ancestors.length > 0) meta.ancestors = ancestors;
fs.writeFileSync(path.join(target, 'paper.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

console.log(`已复制网页：${path.relative(ROOT, source)} → ${path.relative(ROOT, target)}`);
console.log(`已生成 paper.json：本版作者 ${describe([participant])}`);
console.log(`本版减论 ID：${participant.jianlunId || '暂无'}`);
if (ancestors.length > 0) {
  console.log(`已写入版本溯源 ancestors：${describe(ancestors)}`);
} else {
  console.log('未写入 ancestors：被复制的版本没有更早的作者，因此你就是该网页的初始者。');
}
console.log(`现在可以直接修改 ${path.relative(ROOT, target)}/ 里的网页源码了。`);
console.log('提示：新目录没有复制 node_modules 与 dist，如需本地预览请先在该目录执行 npm install。');
