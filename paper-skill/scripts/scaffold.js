#!/usr/bin/env node
/*
 * scaffold.js — project scaffolder for the paper-skill Phase 2 (React + TypeScript output).
 *
 * The deliverable is a self-contained Vite + React 18 + TypeScript project folder, not a
 * single HTML file. This script copies `assets/react-template/` to the target
 * `<paper-short-name>_output/` directory, injects the paper title into `package.json`,
 * `index.html`, and `README.md`, and ensures `public/images/` exists for optional original figures.
 *
 * The Phase 2 coordinator assembles `src/data/tutorial.ts` and `src/modules/*` (+ registry)
 * from isolated chapter packets, then fills `src/styles/paper.css` and `public/images/*`.
 * Framework files are never rewritten.
 *
 * Template resolution: scaffold.js lives next to `scripts/`, while the template lives under
 * `assets/react-template/`. When run from the temporary paperSkill (copied beside
 * `assets/react-template/`), `__dirname` points at the temp skill root. We try both candidate
 * locations and use the first that exists, so the script works in the temp directory and from
 * the source `paper-skill/scripts`.
 *
 * Usage: node scaffold.js <outputDir> [packageName] [titleEn] [titleZh]
 * Exits 0 on success, 2 on usage error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;

// The template lives under assets/react-template/. Accept both the copied temp root
// (<tmp>/assets/react-template) and the source paper-skill/scripts (../assets/react-template).
function findTemplateDir() {
  const candidates = [
    path.join(SCRIPT_DIR, 'assets', 'react-template'),
    path.join(SCRIPT_DIR, '..', 'assets', 'react-template'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]; // fall back; copyDir will fail with a clear path
}

const TEMPLATE = findTemplateDir();

const demoOnlyFiles = new Set([
  'src/data/tutorial.ts',
  'src/modules/registry.tsx',
  'src/modules/MountainJourney.tsx',
  'src/modules/MountainJourney.css',
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', '.vite'].includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    const relative = path.relative(TEMPLATE, s).replace(/\\/g, '/');
    if (demoOnlyFiles.has(relative)) continue;
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error('Usage: node scaffold.js <outputDir> [packageName] [titleEn] [titleZh]');
    process.exit(2);
  }

  const packageName = process.argv[3] || path.basename(outputDir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const titleEn = process.argv[4] || '__PAPER_TITLE_EN__';
  const titleZh = process.argv[5] || '__PAPER_TITLE_ZH__';

  if (!fs.existsSync(TEMPLATE)) {
    console.error('Template not found: ' + TEMPLATE);
    process.exit(2);
  }

  copyDir(TEMPLATE, outputDir);

  // Paper-specific content is written once by the packet assembler. Do not seed a
  // new paper with the mountain demo or an unrelated example widget.
  fs.writeFileSync(path.join(outputDir, 'src', 'data', 'tutorial.ts'),
    "import type { TutorialData } from '../types';\n\nexport const tutorial = {} as TutorialData; // Replaced by packet assembly.\n", 'utf8');
  fs.writeFileSync(path.join(outputDir, 'src', 'modules', 'registry.tsx'),
    "import React from 'react';\nexport interface WidgetProps { chapterId: string; moduleId: string }\nexport const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};\n", 'utf8');

  // --- inject package.json (name + description title) ---
  const pkgPath = path.join(outputDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkg = fs.readFileSync(pkgPath, 'utf8');
    pkg = pkg.split('__PACKAGE_NAME__').join(packageName);
    pkg = pkg.split('__PAPER_TITLE_EN__').join(titleEn);
    fs.writeFileSync(pkgPath, pkg, 'utf8');
  }

  // --- inject index.html (page title) ---
  const htmlPath = path.join(outputDir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.split('__PAPER_TITLE_ZH__').join(titleZh);
    html = html.split('__PAPER_TITLE_EN__').join(titleEn);
    fs.writeFileSync(htmlPath, html, 'utf8');
  }

  // --- inject README.md (paper-specific project title) ---
  const readmePath = path.join(outputDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, 'utf8');
    readme = readme.replace(/<!-- DEMO-START -->[\s\S]*?<!-- DEMO-END -->/, '本项目由 paper-skill 的论文专属章节和交互组件生成。');
    readme = readme.split('__PAPER_TITLE_ZH__').join(titleZh);
    readme = readme.split('__PAPER_TITLE_EN__').join(titleEn);
    fs.writeFileSync(readmePath, readme, 'utf8');
  }

  // --- ensure public/images exists for optional original figures ---
  const imagesDir = path.join(outputDir, 'public', 'images');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'public', 'thumbnails'), { recursive: true });

  console.log('Scaffolded React+TS project at: ' + outputDir);
  console.log('  package name : ' + packageName);
  console.log('  next step    : prepare isolated chapter packets and run assemble-chapter-packets.js');
}

main();
