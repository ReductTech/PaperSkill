#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, OUTPUT_ROOT, PAPER_NAME_RE, VERSION_NAME_RE, findPaper, listVersions } = require('./lib/repository');

function usage() {
  console.error('用法: npm run import -- <生成目录> <paper-name> --title "..." --paper-url "https://..." --participant "李雷" [--pinyin "limei"] [--github "..."] [--date 0903] [--version liming0903] [--force] [--year 2024] [--venue "..."] [--topics "CV,CNN"]');
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

function copyFiltered(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'dist-ssr', 'paper.json', '.git'].includes(entry.name)) continue;
    const src = path.join(source, entry.name);
    const dest = path.join(target, entry.name);
    if (entry.isDirectory()) copyFiltered(src, dest);
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
  throw new Error('无法确定姓名拼音：请使用 --pinyin "liming" 指定（中文姓名无法自动转换）');
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { stamp: raw.slice(5).replace('-', ''), iso: raw };
  }
  if (/^\d{4}$/.test(raw)) {
    const month = raw.slice(0, 2);
    const day = raw.slice(2);
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) throw new Error('--date 不是合法日期（MMDD 或 YYYY-MM-DD）');
    return { stamp: raw, iso: `${now.getFullYear()}-${month}-${day}` };
  }
  throw new Error('--date 必须是 MMDD（例如 0903）或 YYYY-MM-DD');
}

/** 版本目录名：pinyin + MMDD；同一人同一天重复提交追加 _2、_3 */
function resolveVersion(paperDir, base) {
  if (!fs.existsSync(path.join(paperDir, base))) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!fs.existsSync(path.join(paperDir, candidate))) return candidate;
  }
  throw new Error(`版本过多：${base}`);
}

const [sourceArg, paperName, ...rest] = process.argv.slice(2);
if (!sourceArg || !paperName) usage();
if (!PAPER_NAME_RE.test(paperName)) throw new Error('paper-name 必须是论文全称：小写字母、数字，单词间用下划线连接');
const opts = options(rest);
for (const key of ['title', 'paper-url', 'participant']) {
  if (!opts[key]) throw new Error(`缺少 --${key}`);
}
if (!/^https:\/\//.test(opts['paper-url'])) throw new Error('--paper-url 必须是 https:// 链接');

const versionFile = path.join(ROOT, 'paper-skill', 'VERSION');
if (!fs.existsSync(versionFile)) throw new Error('缺少 paper-skill/VERSION');
const skillVersion = fs.readFileSync(versionFile, 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(skillVersion)) throw new Error('paper-skill/VERSION 必须是 x.y.z');

const source = path.resolve(ROOT, sourceArg);
if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) throw new Error(`找不到源目录：${source}`);
if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error('源目录不是 paper-skill 输出：缺少 package.json');

const paperDir = path.join(OUTPUT_ROOT, paperName);
const date = resolveDate(opts);
let version = opts.version ? String(opts.version).trim() : resolveVersion(paperDir, `${pinyinSlug(opts)}${date.stamp}`);
if (!VERSION_NAME_RE.test(version)) throw new Error('版本目录名必须是姓名拼音小写加修改日期，例如 liming0903');

const target = path.join(paperDir, version);
if (fs.existsSync(target) && !opts.force) {
  throw new Error(`版本已存在：${path.relative(ROOT, target)}（同一天再次提交会自动生成新版本，或加 --force 覆盖）`);
}
if (target === source || target.startsWith(`${source}${path.sep}`)) throw new Error('目标目录不能位于源目录内部');

copyFiltered(source, target);
const participant = { name: opts.participant };
if (opts.github) participant.github = opts.github.replace(/^@/, '');
const meta = {
  schemaVersion: 1,
  paperName,
  title: opts.title,
  authors: [],
  year: opts.year ? Number(opts.year) : null,
  venue: opts.venue || '',
  paperUrl: opts['paper-url'],
  participants: [participant],
  topics: opts.topics ? opts.topics.split(',').map((item) => item.trim()).filter(Boolean) : [],
  skillVersion,
  status: 'review',
  entry: 'index.html',
  version,
  versionDate: date.iso,
};
fs.writeFileSync(path.join(target, 'paper.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
console.log(`已导入：${path.relative(ROOT, target)}`);
const paper = findPaper(paperName);
const siblings = paper ? listVersions(paper) : [];
console.log(`该论文现有 ${siblings.length} 个版本：${siblings.map((item) => item.version).join('、') || '（无）'}`);
console.log('下一步：核对 paper.json，运行 npm run validate && npm run catalog，并在提交前执行 git restore catalog/papers.json。');
