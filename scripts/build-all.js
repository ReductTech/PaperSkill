#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, listSubmissions, resolveSubmissions } = require('./lib/repository');

const outputArg = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : 'site/papers';
const outputRoot = path.resolve(ROOT, outputArg);
if (outputRoot !== ROOT && !outputRoot.startsWith(ROOT + path.sep)) {
  throw new Error(`--output path must be within the repository root: ${outputRoot}`);
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function valuesFor(flag) {
  return process.argv.slice(2).flatMap((arg, index, args) => arg === flag && args[index + 1] ? [args[index + 1]] : []);
}

const requested = valuesFor('--paper');

function run(args, cwd) {
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npm;
  const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', npm, ...args] : args;
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

// --paper 支持 <paper-name> 与 <paper-name>/<version> 两种写法
const submissions = requested.length
  ? [...new Set(requested)].flatMap((target) => {
      const matched = resolveSubmissions(target);
      if (matched.length === 0) throw new Error(`找不到教程：html_output/${target}`);
      return matched;
    })
  : listSubmissions();

fs.mkdirSync(outputRoot, { recursive: true });
for (const submission of submissions) {
  const label = `${submission.paperName}/${submission.version}`;
  console.log(`\n构建 ${label}...`);
  run(['ci', '--no-audit', '--no-fund'], submission.dir);
  // paper-skill projects intentionally use noEmit; check application types without
  // TypeScript build-mode emit, then let Vite produce the deployment bundle.
  const checkConfig = path.join(submission.dir, '.paper-repo-tsconfig.json');
  fs.writeFileSync(checkConfig, `${JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { noEmit: true },
    references: [],
    include: ['src'],
  }, null, 2)}\n`, 'utf8');
  try {
    run(['exec', '--', 'tsc', '--noEmit', '-p', path.basename(checkConfig)], submission.dir);
  } finally {
    // 临时 tsconfig 清理失败不中断构建（沙箱/回收站策略下可能受限，残留文件会被下次覆盖）
    try {
      fs.rmSync(checkConfig, { force: true });
    } catch (error) {
      console.warn(`  （可选）临时文件清理失败：${error.message}`);
    }
  }
  run(['exec', '--', 'vite', 'build'], submission.dir);
  const dist = path.join(submission.dir, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`${label} 未生成 dist/index.html`);
  fs.cpSync(dist, path.join(outputRoot, submission.paperName, submission.version), { recursive: true, force: true });
}
console.log(`\n${requested.length ? `${submissions.length} 个指定版本` : `全部 ${submissions.length} 个版本`}已构建到 ${path.relative(ROOT, outputRoot)}。`);
