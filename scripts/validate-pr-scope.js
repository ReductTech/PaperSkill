#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const { ROOT } = require('./lib/repository');

const pullRequestBase = process.env.GITHUB_BASE_REF;
const base = pullRequestBase || process.argv[2];
if (!base) {
  console.log('非 Pull Request 环境，跳过变更范围检查。');
  process.exit(0);
}

const baseRef = base.startsWith('origin/') ? base : `origin/${base}`;

function readGitFiles(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr || '无法读取 Pull Request 变更范围。');
    process.exit(1);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

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
for (const line of statusLines) {
  const parts = line.split('\t');
  const status = parts[0];
  const code = status[0];
  // R/C 行格式为 "R100\t<旧路径>\t<新路径>"，目录名以新路径为准
  const file = code === 'R' || code === 'C' ? parts[2] : parts[1];
  const dir = file && file.replace(/\\/g, '/').match(/^html_output\/([^/]+)\//)?.[1];
  if (!dir) continue;
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
if (paperDirs.size > 1) {
  console.error(`一份 PR 只能修改一篇论文，当前涉及：${[...paperDirs].join(', ')}`);
  process.exit(1);
}
if (touchesSkill && touchesPaper) {
  console.error('paper-skill 修改与论文内容参与任务必须拆成不同 Pull Request。');
  process.exit(1);
}
console.log(`PR 范围检查通过（${files.length} 个文件${paperDirs.size ? `，论文：${[...paperDirs][0]}` : ''}）。`);
