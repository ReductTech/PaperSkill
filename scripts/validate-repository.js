#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, listPapers, listVersions, metadataFor, validateMetadata } = require('./lib/repository');

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
  const papers = listPapers();
  if (papers.length === 0) {
    console.error('没有找到论文目录：html_output/<paper-name>/');
    process.exit(1);
  }
  const submissions = papers.flatMap((paper) => listVersions(paper));
  if (submissions.length === 0) {
    console.error('没有找到版本目录：html_output/<paper-name>/<pinyin><MMDD>/');
    process.exit(1);
  }

  let failures = 0;
  console.log(`验证 ${papers.length} 篇论文、共 ${submissions.length} 个版本...`);

  for (const paper of papers) {
    const versions = listVersions(paper);
    console.log(`\n[${paper.paperName}] ${versions.length} 个版本`);
    if (versions.length === 0) {
      console.error(`  ✗ 论文目录下没有版本目录（缺少 html_output/${paper.paperName}/<pinyin><MMDD>/paper.json）`);
      failures += 1;
      continue;
    }
    const names = new Set();

    for (const submission of versions) {
      console.log(`  · ${submission.version}`);
      if (names.has(submission.version)) {
        console.error(`    ✗ 版本目录重复：${submission.version}`);
        failures += 1;
      }
      names.add(submission.version);

      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(submission.dir, file))) {
          console.error(`    ✗ 缺少 ${file}`);
          failures += 1;
        }
      }

      for (const item of trackedForbidden(submission)) {
        console.error(`    ✗ 不应提交 ${item}`);
        failures += 1;
      }

      try {
        const meta = metadataFor(submission);
        const errors = validateMetadata(meta, paper.paperName, submission.version);
        for (const error of errors) {
          console.error(`    ✗ paper.json：${error}`);
          failures += 1;
        }
      } catch (error) {
        console.error(`    ✗ ${error.message}`);
        failures += 1;
      }

      const skillValidator = path.join(ROOT, 'paper-skill', 'scripts', 'validate-output.js');
      const result = spawnSync(process.execPath, [skillValidator, submission.dir], { encoding: 'utf8' });
      if (result.status !== 0) {
        console.error(result.stdout || '');
        console.error(result.stderr || '');
        failures += 1;
      } else {
        console.log('    ✓ paper-skill 结构验证通过');
      }
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
