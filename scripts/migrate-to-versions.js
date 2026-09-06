#!/usr/bin/env node
'use strict';

/**
 * 一次性迁移：把扁平的 html_output/<paper-name>/ 迁移为
 * html_output/<paper-name>/<姓名拼音小写><MMDD>/ 的版本结构。
 *
 * 默认 dry-run（只打印计划），确认无误后加 --apply 执行。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, OUTPUT_ROOT, PAPER_NAME_RE, listPapers, listVersions } = require('./lib/repository');

const apply = process.argv.includes('--apply');
const planFile = path.join(ROOT, 'tmp', 'migration-plan.json');
const logFile = path.join(ROOT, 'tmp', 'version-migration.json');

function loadPinyin() {
  for (const id of ['pinyin-pro', path.join(ROOT, 'node_modules', 'pinyin-pro')]) {
    try {
      return require(id).pinyin;
    } catch (error) {
      // 继续尝试下一个候选
    }
  }
  console.warn('未找到 pinyin-pro，中文姓名将退化为 GitHub 用户名（建议安装后重跑：npm i pinyin-pro）');
  return null;
}

const toPinyin = loadPinyin();

function slugFor(participant) {
  const name = (participant && participant.name) || '';
  if (/[一-龥]/.test(name) && toPinyin) {
    const converted = toPinyin(name, { toneType: 'none', type: 'array' }).join('');
    if (converted) return normalize(converted);
  }
  const ascii = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ascii) return normalize(ascii);
  if (participant && participant.github) {
    const fromGithub = String(participant.github).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fromGithub) return normalize(fromGithub);
  }
  return 'contributor';
}

// 版本目录名必须以字母开头（正则 ^[a-z][a-z0-9]*\d{4}）
function normalize(value) {
  return /^[a-z]/.test(value) ? value : `u${value}`;
}

function gitDate(dir) {
  const relative = path.relative(ROOT, dir).replace(/\\/g, '/');
  const result = spawnSync('git', ['log', '-1', '--date=short', '--format=%ad', '--', relative], { cwd: ROOT, encoding: 'utf8' });
  const value = (result.stdout || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const stat = fs.statSync(dir);
  const mtime = new Date(stat.mtimeMs);
  return `${mtime.getFullYear()}-${String(mtime.getMonth() + 1).padStart(2, '0')}-${String(mtime.getDate()).padStart(2, '0')}`;
}

function uniqueName(paperDir, base) {
  if (!fs.existsSync(path.join(paperDir, base))) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!fs.existsSync(path.join(paperDir, candidate))) return candidate;
  }
  throw new Error(`版本过多：${base}`);
}

// node_modules / dist 等为本地可重建产物，rename 失败时直接丢弃，避免复制海量文件
const REBUILDABLE = new Set(['node_modules', 'dist', 'dist-ssr']);

function moveEntry(source, target, name) {
  try {
    fs.renameSync(source, target);
    return;
  } catch (error) {
    if (REBUILDABLE.has(name)) {
      fs.rmSync(source, { recursive: true, force: true });
      console.warn(`  已丢弃本地可重建目录（可重新安装/构建）：${name}`);
      return;
    }
  }
  fs.cpSync(source, target, { recursive: true });
  fs.rmSync(source, { recursive: true, force: true });
}

function main() {
  if (!fs.existsSync(OUTPUT_ROOT)) throw new Error(`找不到 ${OUTPUT_ROOT}`);
  const entries = fs.readdirSync(OUTPUT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({ paperName: entry.name, dir: path.join(OUTPUT_ROOT, entry.name) }))
    .filter((paper) => PAPER_NAME_RE.test(paper.paperName));

  const plan = [];
  for (const paper of entries) {
    const metaFile = path.join(paper.dir, 'paper.json');
    if (!fs.existsSync(metaFile)) {
      const versions = fs.readdirSync(paper.dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(paper.dir, entry.name, 'paper.json')));
      if (versions.length > 0) {
        console.log(`跳过（已是版本结构）：${paper.paperName}`);
        continue;
      }
      console.warn(`跳过（既不是扁平教程也不是版本结构）：${paper.paperName}`);
      continue;
    }
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    const participant = (meta.participants && meta.participants[0]) || {};
    const isoDate = gitDate(paper.dir);
    const stamp = isoDate.slice(5).replace('-', '');
    const version = uniqueName(paper.dir, `${slugFor(participant)}${stamp}`);
    plan.push({ paperName: paper.paperName, dir: paper.dir, version, versionDate: isoDate, meta });
  }

  console.log(`\n共 ${plan.length} 篇论文待迁移：\n`);
  for (const item of plan) {
    console.log(`  html_output/${item.paperName}/ → html_output/${item.paperName}/${item.version}/  (${item.versionDate})`);
  }

  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  fs.writeFileSync(planFile, `${JSON.stringify(plan.map(({ paperName, version, versionDate }) => ({ paperName, version, versionDate })), null, 2)}\n`, 'utf8');

  if (!apply) {
    console.log('\n以上为预演结果，未做任何改动。确认后运行：npm run migrate:versions -- --apply');
    return;
  }

  for (const item of plan) {
    const versionDir = path.join(item.dir, item.version);
    fs.mkdirSync(versionDir, { recursive: true });
    for (const entry of fs.readdirSync(item.dir)) {
      if (entry === item.version) continue;
      moveEntry(path.join(item.dir, entry), path.join(versionDir, entry), entry);
    }
    const metaFile = path.join(versionDir, 'paper.json');
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.version = item.version;
    meta.versionDate = item.versionDate;
    fs.writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
    console.log(`已迁移 html_output/${item.paperName}/${item.version}/`);
  }

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, `${JSON.stringify(plan.map(({ paperName, version, versionDate }) => ({ paperName, version, versionDate })), null, 2)}\n`, 'utf8');
  console.log(`\n迁移完成：${plan.length} 篇。映射记录：${path.relative(ROOT, logFile)}`);
  console.log('下一步：npm run validate && npm run catalog');
}

/** 目录已就位但 paper.json 缺少 version / versionDate 时补齐 */
function finalize() {
  const stored = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : [];
  const dates = new Map(stored.map((item) => [item.paperName, item.versionDate]));
  let updated = 0;
  for (const paper of listPapers()) {
    for (const submission of listVersions(paper)) {
      const file = path.join(submission.dir, 'paper.json');
      const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (meta.version === submission.version && meta.versionDate) continue;
      meta.version = submission.version;
      meta.versionDate = meta.versionDate || dates.get(paper.paperName) || gitDate(submission.dir);
      fs.writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
      updated += 1;
      console.log(`已补齐 paper.json：html_output/${paper.paperName}/${submission.version}/`);
    }
  }
  console.log(`\n补齐完成：${updated} 个版本。`);
}

if (process.argv.includes('--finalize')) finalize();
else main();
