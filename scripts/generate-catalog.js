#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, catalogRecords } = require('./lib/repository');

const target = path.join(ROOT, 'catalog', 'papers.json');
const records = catalogRecords();
const next = `${JSON.stringify(records, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  const normalizedCurrent = current.replace(/\r\n?/g, '\n');
  if (normalizedCurrent !== next) {
    console.error('catalog/papers.json 不是最新版本，请运行 npm run catalog。');
    process.exit(1);
  }
  const versionCount = records.reduce((sum, record) => sum + record.versions.length, 0);
  console.log(`目录索引已同步（${records.length} 篇论文、${versionCount} 个版本）。`);
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, next, 'utf8');
  const versionCount = records.reduce((sum, record) => sum + record.versions.length, 0);
  console.log(`已生成 catalog/papers.json（${records.length} 篇论文、${versionCount} 个版本）。`);
}
