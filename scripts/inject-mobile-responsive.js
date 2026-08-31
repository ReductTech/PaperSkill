#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/repository');

function injectMobileResponsive(siteRoot) {
  const site = path.resolve(siteRoot);
  const papers = path.join(site, 'papers');
  fs.mkdirSync(site, { recursive: true });

  for (const file of ['mobile-responsive.css', 'mobile-responsive.js']) {
    fs.copyFileSync(path.join(ROOT, 'portal', file), path.join(site, file));
  }

  const assets = [
    '  <link rel="stylesheet" href="../../mobile-responsive.css?v=20260831-9">',
    '  <script src="../../mobile-responsive.js?v=20260831-9" defer></script>',
  ].join('\n');

  let count = 0;
  if (!fs.existsSync(papers)) return count;
  for (const entry of fs.readdirSync(papers, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tutorialIndex = path.join(papers, entry.name, 'index.html');
    if (!fs.existsSync(tutorialIndex)) continue;
    const html = fs.readFileSync(tutorialIndex, 'utf8')
      .replace(/\s*<link[^>]+mobile-responsive\.css[^>]*>\s*/g, '\n')
      .replace(/\s*<script[^>]+mobile-responsive\.js[^>]*><\/script>\s*/g, '\n');
    fs.writeFileSync(tutorialIndex, html.replace('</head>', `${assets}\n</head>`), 'utf8');
    count += 1;
  }
  return count;
}

if (require.main === module) {
  const target = process.argv[2] || path.join(ROOT, 'site');
  console.log(`已为 ${injectMobileResponsive(target)} 篇教程注入手机端响应规则。`);
}

module.exports = { injectMobileResponsive };
