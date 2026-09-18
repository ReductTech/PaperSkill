#!/usr/bin/env node
/*
 * preflight.js — local pre-PR check.
 *
 * Runs the same checks the repository CI runs for a pull request, then rehearses the merge
 * against the base branch, so a contributor can see BEFORE pushing or opening a PR whether it
 * will pass and merge — and, when it will not, exactly why.
 *
 * It intentionally adds no new thresholds; it mirrors CI plus a merge rehearsal.
 *
 * Usage:
 *   npm run preflight
 *   npm run preflight -- --base upstream/main
 *   npm run preflight -- --no-fetch --no-build
 *
 * Exit 0 = ready to open a PR, 1 = at least one blocker was found.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./lib/repository');

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(name);
function optionValue(name) {
  const index = argv.indexOf(name);
  if (index < 0) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

const noFetch = hasFlag('--no-fetch');
const noBuild = hasFlag('--no-build');
const requestedBase = optionValue('--base');

function git(args) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}
function gitText(args) {
  const result = git(args);
  return result.status === 0 ? result.stdout.trim() : '';
}
function gitOk(args) {
  return git(args).status === 0;
}
function short(sha) {
  return sha ? sha.slice(0, 8) : '????????';
}

const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-preflight-'));
const blockers = [];
const warnings = [];
const block = (message) => blockers.push(message);
const warn = (message) => warnings.push(message);

// ---------------------------------------------------------------------------
// Resolve the base branch: prefer the canonical ReductTech remote, then
// upstream/origin/main. Contributors on a fork get upstream/main; maintainers
// on the main clone get origin/main.
// ---------------------------------------------------------------------------

function resolveBase() {
  if (requestedBase) return requestedBase;
  const remotes = gitText(['remote']).split(/\r?\n/).filter(Boolean);
  const canonical = remotes.filter((remote) =>
    /ReductTech\/PaperSkill/i.test(gitText(['remote', 'get-url', remote]))
  );
  for (const remote of [...canonical, 'upstream', 'origin']) {
    if (gitOk(['rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/main`])) {
      return `${remote}/main`;
    }
  }
  return 'main';
}

function baseRemote(baseRef) {
  const match = /^([^/]+)\//.exec(baseRef);
  return match ? match[1] : null;
}

function conflictFiles(text) {
  const files = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\d{6} [0-9a-f]+ \d+\t(.+)$/.exec(line);
    if (match) files.add(match[1]);
  }
  return [...files].slice(0, 20);
}

// ---------------------------------------------------------------------------
// Gather state
// ---------------------------------------------------------------------------

const branch = gitText(['rev-parse', '--abbrev-ref', 'HEAD']) || '(detached)';
const head = gitText(['rev-parse', 'HEAD']);
const base = resolveBase();
const remote = baseRemote(base);
const baseName = remote ? base.slice(remote.length + 1) : base;

let fetched = false;
if (!noFetch && remote) {
  fetched = git(['fetch', remote, baseName]).status === 0;
  if (!fetched) warn(`无法从 ${remote} 获取最新 ${baseName}，合并预演可能基于过期的基线。`);
}

const baseSha = gitText(['rev-parse', '--verify', '--quiet', base]);
if (!baseSha) {
  block(
    `找不到基线分支 ${base}。请先执行 \`git fetch ${remote || 'origin'} main\`，`
    + '或用 `--base <ref>` 指定正确的基线（例如 upstream/main）。'
  );
}

if (baseSha) {
  const commitCount = Number(gitText(['rev-list', '--count', `${base}..HEAD`]) || '0');
  if (commitCount === 0) {
    warn(`当前分支相对 ${base} 没有新提交，没有内容可以提交 PR。`);
  }
  if (gitText(['status', '--porcelain'])) {
    warn('工作区有未提交改动：PR 与 CI 只包含已提交内容，请先 commit。');
  }
}

// ---------------------------------------------------------------------------
// Merge rehearsal (no worktree changes)
// ---------------------------------------------------------------------------

let merge = { kind: 'unknown', detail: [] };
if (baseSha) {
  if (gitOk(['merge-base', '--is-ancestor', base, 'HEAD'])) {
    merge = { kind: 'fast-forward', detail: [] };
  } else {
    const result = git(['merge-tree', '--write-tree', base, 'HEAD']);
    const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
    fs.writeFileSync(path.join(logDir, '04-merge-rehearsal.log'), combined, 'utf8');
    if (result.status === 0) {
      merge = { kind: 'clean', detail: [] };
    } else if (/unknown option|usage: git merge-tree/i.test(combined)) {
      const mergeBase = gitText(['merge-base', base, 'HEAD']);
      const fallback = git(['merge-tree', mergeBase, base, 'HEAD']);
      const text = fallback.stdout || '';
      const conflicted = /^<{7}|^\|{7}|^={7}$|^>{7}/m.test(text);
      merge = conflicted
        ? { kind: 'conflict', detail: conflictFiles(text) }
        : { kind: 'clean', detail: [] };
    } else {
      merge = { kind: 'conflict', detail: conflictFiles(combined) };
    }
  }
}

const mergeLabel = {
  'fast-forward': '可快进合并',
  clean: '可干净合并',
  conflict: '存在合并冲突',
  unknown: '未能判定',
}[merge.kind];

// ---------------------------------------------------------------------------
// Run the CI-equivalent steps
// ---------------------------------------------------------------------------

const steps = [
  {
    label: '仓库结构校验 (npm run validate)',
    file: '01-validate.log',
    args: [path.join(ROOT, 'scripts', 'validate-repository.js')],
  },
  {
    label: `PR 范围校验 (npm run validate:pr -- ${base})`,
    file: '02-validate-pr-scope.log',
    args: [path.join(ROOT, 'scripts', 'validate-pr-scope.js'), base],
  },
];
if (!noBuild) {
  steps.push({
    label: `变更教程构建 (npm run build:changed -- ${base})`,
    file: '03-build-changed.log',
    args: [path.join(ROOT, 'scripts', 'build-changed.js'), base],
  });
}

console.log('PaperSkill 提交预检 (preflight)');
console.log('='.repeat(64));
console.log(`分支    : ${branch}`);
console.log(`提交    : ${short(head)}`);
console.log(`基线    : ${base} (${short(baseSha)})${remote ? (fetched ? ' [已更新]' : ' [未更新]') : ''}`);
console.log(`工作区  : ${gitText(['status', '--porcelain']) ? '有未提交改动（见提醒）' : '干净'}`);
console.log('='.repeat(64));

for (let index = 0; index < steps.length; index += 1) {
  const step = steps[index];
  process.stdout.write(`[${index + 1}/${steps.length + 1}] ${step.label} ... `);
  const result = spawnSync(process.execPath, step.args, { cwd: ROOT, encoding: 'utf8' });
  fs.writeFileSync(
    path.join(logDir, step.file),
    `$ node ${step.args.join(' ')}\n\n[stdout]\n${result.stdout || ''}\n[stderr]\n${result.stderr || ''}\n`,
    'utf8'
  );
  if (result.status === 0) {
    console.log('通过');
  } else {
    console.log('失败');
    step.failedOutput = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
    block(`${step.label} 未通过`);
  }
}

console.log(`[${steps.length + 1}/${steps.length + 1}] 与 ${base} 合并预演 ... ${mergeLabel}`);
if (merge.kind === 'conflict') {
  block(`与 ${base} 存在合并冲突${merge.detail.length ? `：${merge.detail.join(', ')}` : ''}`);
}

console.log('-'.repeat(64));
if (blockers.length === 0) {
  console.log('结论: ✅ 可以创建 PR');
  console.log('（以上检查全部通过，且相对基线可以合并）');
  if (warnings.length > 0) {
    console.log('提醒:');
    for (const item of warnings) console.log(`  · ${item}`);
  }
  process.exit(0);
}

console.log(`结论: ❌ 不要创建 PR（${blockers.length} 个阻断项${warnings.length ? `，${warnings.length} 个提醒` : ''}）`);
for (const item of blockers) console.log(`  ✗ ${item}`);
for (const item of warnings) console.log(`  ! ${item}`);

for (const step of steps) {
  if (!step.failedOutput) continue;
  const lines = step.failedOutput.split(/\r?\n/);
  console.log(`\n--- ${step.label} 关键输出 ---`);
  console.log(lines.slice(-15).join('\n'));
}
if (merge.kind === 'conflict' && merge.detail.length > 0) {
  console.log(`\n冲突文件：${merge.detail.join(', ')}`);
}

console.log(`\n完整日志: ${logDir}`);
process.exit(1);
