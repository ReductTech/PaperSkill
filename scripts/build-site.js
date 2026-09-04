#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./lib/repository');

function nodeScript(name, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', name), ...args], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

const site = path.join(ROOT, 'site');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });

nodeScript('validate-repository.js');
nodeScript('generate-catalog.js');
nodeScript('build-all.js', ['--output', 'site/papers']);

for (const file of ['index.html', 'styles.css', 'app.js']) {
  fs.copyFileSync(path.join(ROOT, 'portal', file), path.join(site, file));
}
fs.copyFileSync(path.join(ROOT, 'catalog', 'papers.json'), path.join(site, 'papers.json'));
fs.writeFileSync(path.join(site, '.nojekyll'), '', 'utf8');
console.log('集合站已生成到 site/。');

