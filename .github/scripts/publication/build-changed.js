#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT, PAPER_NAME_RE, VERSION_NAME_RE, resolveSubmissions } = require('../../../scripts/lib/repository');

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || '无法读取 PR 变更');
  return result.stdout;
}

function build(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function main() {
  const base = process.env.GITHUB_BASE_REF || 'main';
  const compare = (base.includes('/') ? base : 'origin/' + base) + '...HEAD';
  const fields = git(['diff', '--no-renames', '--name-status', '-z', compare]).split('\0');
  if (fields.pop() !== '' || fields.length % 2) throw new Error('无效的 PR 路径列表');
  const changes = [];
  for (let index = 0; index < fields.length; index += 2) {
    const [status, file] = fields.slice(index, index + 2);
    const [, paper, version, leaf] = file.split('/');
    const paperName = file.startsWith('html_output/') && PAPER_NAME_RE.test(paper || '') ? paper : null;
    const target = paperName && leaf && VERSION_NAME_RE.test(version || '') ? paper + '/' + version : null;
    changes.push({ status, file, paperName, target });
  }

  const removed = new Set();
  for (const { status, target, file } of changes) {
    if (status === 'D' && target && file === 'html_output/' + target + '/paper.json' &&
        !git(['ls-tree', 'HEAD', '--', 'html_output/' + target]).trim()) removed.add(target);
  }

  const shared = /^(?:scripts\/|paper-skill\/|schemas\/|package\.json$|\.github\/workflows\/(?:validate-pr|deploy-pages)\.yml$)/;
  if (!removed.size || changes.some(({ file }) => shared.test(file))) {
    build('build-changed.js');
    return;
  }

  const targets = new Set();
  for (const { paperName, target } of changes) {
    if (target) {
      if (!removed.has(target)) targets.add(target);
    } else if (paperName) {
      for (const version of resolveSubmissions(paperName)) targets.add(paperName + '/' + version.version);
    }
  }
  if (!targets.size) {
    console.log('本次 PR 完整撤销了版本，没有剩余的变更版本需要构建。');
    return;
  }
  build('build-all.js', ['--output', 'site/papers', ...[...targets].flatMap(target => ['--paper', target])]);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}