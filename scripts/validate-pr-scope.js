#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');
const { ROOT } = require('./lib/repository');

const pullRequestBase = process.env.GITHUB_BASE_REF;
const base = pullRequestBase || process.argv[2];
if (!base) {
  console.log('非 Pull Request 环境，跳过变更范围检查。');
  process.exit(0);
}

const baseRef = base.includes('/') ? base : `origin/${base}`;

function readGitFiles(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr || '无法读取 Pull Request 变更范围。');
    process.exit(1);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

// 单篇论文限制只作用于外部 fork 的 PR；本仓库内部分支的 PR 跳过该数量校验。
// CI 中从 pull_request 事件负载判断，本地（preflight）从当前分支跟踪的 remote 判断。
function detectForkFromEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return null;
  try {
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const head = event.pull_request && event.pull_request.head && event.pull_request.head.repo;
    const baseRepo = event.pull_request && event.pull_request.base && event.pull_request.base.repo;
    if (head && baseRepo && head.full_name && baseRepo.full_name) {
      return head.full_name.toLowerCase() !== baseRepo.full_name.toLowerCase();
    }
    if (head && typeof head.fork === 'boolean') return head.fork;
  } catch (error) {
    /* fall through to remote detection */
  }
  return null;
}

function detectForkFromRemote() {
  const branchResult = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  const branch = branchResult.status === 0 ? branchResult.stdout.trim() : '';
  if (!branch || branch === 'HEAD') return null;
  const remoteResult = spawnSync('git', ['config', '--get', `branch.${branch}.remote`], { cwd: ROOT, encoding: 'utf8' });
  const remote = (remoteResult.status === 0 && remoteResult.stdout.trim()) || 'origin';
  const urlResult = spawnSync('git', ['remote', 'get-url', remote], { cwd: ROOT, encoding: 'utf8' });
  if (urlResult.status !== 0) return null;
  const url = urlResult.stdout.trim();
  if (!url) return null;
  return !/reducttech\/paperskill(\.git)?$/i.test(url);
}

const forkFromEvent = detectForkFromEvent();
const isForkPullRequest = forkFromEvent === null ? (detectForkFromRemote() ?? false) : forkFromEvent;

const statusLines = pullRequestBase
  ? readGitFiles(['diff', '--name-status', `${baseRef}...HEAD`])
  : [
      ...readGitFiles(['diff', '--name-status', baseRef]),
      ...readGitFiles(['ls-files', '--others', '--exclude-standard']).map((file) => `A\t${file}`),
    ];
const files = [...new Set(statusLines.map((line) => line.split('\t')[1]).filter(Boolean).map((file) => file.replace(/\\/g, '/')))].sort();

const added = new Set();
const deleted = new Set();
const modified = new Set();
const addedVersions = new Set();
for (const line of statusLines) {
  const parts = line.split('\t');
  const status = parts[0];
  const code = status[0];
  // R/C 行格式为 "R100\t<旧路径>\t<新路径>"，目录名以新路径为准
  const file = code === 'R' || code === 'C' ? parts[2] : parts[1];
  const match = file && file.replace(/\\/g, '/').match(/^html_output\/([^/]+)(?:\/([^/]+))?\//);
  if (!match) continue;
  const [, dir, version] = match;
  if (version) addedVersions.add(`${dir}/${version}`);
  if (code === 'A' || code === 'R' || code === 'C') added.add(dir);
  else if (code === 'D') deleted.add(dir);
  else modified.add(dir);
}
const paperDirs = new Set([...added, ...deleted, ...modified]);
const touchesSkill = files.some((file) => file.startsWith('paper-skill/'));
const touchesPaper = paperDirs.size > 0;
const touchesCatalog = files.includes('catalog/papers.json');

if (touchesPaper && touchesCatalog) {
  console.error('论文参与 PR 不应提交 catalog/papers.json；该索引由管理员统一生成。');
  process.exit(1);
}

// 允许「单篇论文改名」：恰好一个目录被删除、另一个被新增，且无其他论文目录改动
if (added.size === 1 && deleted.size === 1 && modified.size === 0) {
  console.log(`PR 范围检查通过（论文改名：${[...deleted][0]} → ${[...added][0]}）。`);
  process.exit(0);
}
if (isForkPullRequest && paperDirs.size > 1) {
  console.error(`一份 PR 只能修改一篇论文，当前涉及：${[...paperDirs].join(', ')}`);
  process.exit(1);
}
if (!isForkPullRequest && paperDirs.size > 1) {
  console.log(`（本仓库内部 PR，跳过单篇论文数量限制：本次涉及 ${paperDirs.size} 篇）`);
}
if (touchesSkill && touchesPaper) {
  console.error('paper-skill 修改与论文内容参与任务必须拆成不同 Pull Request。');
  process.exit(1);
}
const versionNote = addedVersions.size ? `，版本：${[...addedVersions].join(', ')}` : '';
const paperNote = paperDirs.size ? `，论文：${[...paperDirs].join(', ')}${versionNote}` : '';
const scopeNote = isForkPullRequest ? '外部 fork，单篇论文限制生效' : '本仓库内部 PR，已跳过单篇论文数量限制';
console.log(`PR 范围检查通过（${files.length} 个文件${paperNote}；${scopeNote}）。`);
