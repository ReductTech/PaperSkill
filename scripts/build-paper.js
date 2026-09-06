#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, PAPER_NAME_RE, VERSION_NAME_RE } = require('./lib/repository');

const targets = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
if (targets.length === 0) {
  console.error('用法：npm run build:paper -- <paper-name> 或 <paper-name>/<version>');
  process.exit(1);
}
for (const target of targets) {
  const [paperName, version] = target.split('/');
  if (!PAPER_NAME_RE.test(paperName)) {
    console.error(`论文目录标识格式无效：${paperName}`);
    process.exit(1);
  }
  if (version && !VERSION_NAME_RE.test(version)) {
    console.error(`版本目录名格式无效：${version}（应为姓名拼音小写加修改日期，例如 liming0903）`);
    process.exit(1);
  }
}

const args = [path.join(ROOT, 'scripts', 'build-all.js'), '--output', 'site/papers'];
for (const target of targets) args.push('--paper', target);
const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status || 0);
