#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, listSubmissions } = require('./lib/repository');

const outputArg = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : 'site/papers';
const outputRoot = path.resolve(ROOT, outputArg);
if (outputRoot !== ROOT && !outputRoot.startsWith(ROOT + path.sep)) {
  throw new Error(`--output path must be within the repository root: ${outputRoot}`);
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function valuesFor(flag) {
  return process.argv.slice(2).flatMap((arg, index, args) => arg === flag && args[index + 1] ? [args[index + 1]] : []);
}

const requestedPapers = valuesFor('--paper');

function run(args, cwd) {
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npm;
  const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', npm, ...args] : args;
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const allSubmissions = listSubmissions();
const submissionsByPaperName = new Map(allSubmissions.map((submission) => [submission.paperName, submission]));
const submissions = requestedPapers.length
  ? [...new Set(requestedPapers)].map((paperName) => {
      const submission = submissionsByPaperName.get(paperName);
      if (!submission) throw new Error(`论文目录不存在：html_output/${paperName}`);
      return submission;
    })
  : allSubmissions;

fs.mkdirSync(outputRoot, { recursive: true });
for (const submission of submissions) {
  console.log(`\n构建 ${submission.paperName}...`);
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
    fs.rmSync(checkConfig, { force: true });
  }
  run(['exec', '--', 'vite', 'build'], submission.dir);
  const dist = path.join(submission.dir, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`${submission.paperName} 未生成 dist/index.html`);
  fs.cpSync(dist, path.join(outputRoot, submission.paperName), { recursive: true, force: true });
}
console.log(`\n${requestedPapers.length ? `${submissions.length} 篇指定教程` : '全部教程'}已构建到 ${path.relative(ROOT, outputRoot)}。`);
