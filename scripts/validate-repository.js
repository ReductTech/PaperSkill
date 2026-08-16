#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, listSubmissions, metadataFor, validateMetadata } = require('./lib/repository');

const requiredFiles = [
  'paper.json', 'README.md', 'package.json', 'package-lock.json', 'index.html',
  'vite.config.ts', 'tsconfig.json', 'src/App.tsx', 'src/data/tutorial.ts',
  'src/modules/registry.tsx', 'src/styles/paper.css',
];
const forbiddenNames = ['node_modules', 'dist', 'dist-ssr'];

function trackedForbidden(submission) {
  const relativeDir = path.relative(ROOT, submission.dir).replace(/\\/g, '/');
  const result = spawnSync('git', ['ls-files', '--', `${relativeDir}/`], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean).filter((file) =>
    forbiddenNames.some((name) => file.split('/').includes(name))
  );
}

function main() {
  const submissions = listSubmissions();
  if (submissions.length === 0) {
    console.error('没有找到论文目录：html_output/<paper-name>/');
    process.exit(1);
  }

  let failures = 0;
  console.log(`验证 ${submissions.length} 篇论文教程...`);

  for (const submission of submissions) {
    console.log(`\n[${submission.paperName}]`);
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(submission.dir, file))) {
        console.error(`  ✗ 缺少 ${file}`);
        failures += 1;
      }
    }

    const forbidden = trackedForbidden(submission);
    for (const item of forbidden) {
      console.error(`  ✗ 不应提交 ${item}`);
      failures += 1;
    }

    try {
      const meta = metadataFor(submission);
      const errors = validateMetadata(meta, submission.paperName);
      for (const error of errors) {
        console.error(`  ✗ paper.json：${error}`);
        failures += 1;
      }
    } catch (error) {
      console.error(`  ✗ ${error.message}`);
      failures += 1;
    }

    const skillValidator = path.join(ROOT, 'paper-skill', 'scripts', 'validate-output.js');
    const result = spawnSync(process.execPath, [skillValidator, submission.dir], { encoding: 'utf8' });
    if (result.status !== 0) {
      console.error(result.stdout || '');
      console.error(result.stderr || '');
      failures += 1;
    } else {
      console.log('  ✓ paper-skill 结构验证通过');
    }
  }

  console.log('');
  if (failures > 0) {
    console.error(`仓库验证失败：${failures} 项问题`);
    process.exit(1);
  }
  console.log('仓库验证通过。');
}

main();
