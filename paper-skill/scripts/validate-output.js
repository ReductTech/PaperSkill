#!/usr/bin/env node
/*
 * validate-output.js — automated structural validator for the paper-skill React + TS output.
 *
 * Runs as a hard gate after the project folder is generated (see scripts/validation-checklist.md).
 * All hard thresholds are loaded from contract.md so the validator cannot drift from the
 * skill's single source of truth.
 *
 * Checks:
 *   1. required framework files exist (index.html, package.json, src/main.tsx, App.tsx,
 *      types.ts, src/data/tutorial.ts, styles, src/modules/registry.tsx, configs).
 *   2. `kind: "chapter"` count within [chapterCountMin, chapterCountMax].
 *   3. `kind: "module"` count >= activeModulesMin; >= dualModuleChaptersMin chapters have two.
 *   4. no leftover template placeholders (__XXX__, __METAPHOR_CSS__, TBD, TODO) in
 *      src/data/tutorial.ts, src/styles/paper.css, or src/modules/*.
 *   5. every Bilibili bvid (if any) is a real `BV...` (empty bvid tolerated as "omit").
 *   6. every componentId referenced in tutorial.ts is registered in src/modules/registry.tsx
 *      (the seeded `example-slider` is always allowed).
 *   7. syntax parse of every project source file (src/** and vite config) with TypeScript or
 *      esbuild; catches truncated or unbalanced files before the repository CI build.
 *
 * Usage: node scripts/validate-output.js <path-to>/<paper-short-name>_output
 * Exits 0 on pass, 1 on any failure, 2 on usage error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { checkProject } = require('./syntax-check.js');

// --- CONFIG (read directly from contract.md §2, §3) ---
// Contract lives beside this script in the repository (paper-skill/scripts -> paper-skill/) and
// may be copied beside the helpers in a generated intermediate skill.
const contractCandidates = [
  path.join(__dirname, '..', 'contract.md'),
  path.join(__dirname, 'contract.md'),
  path.join(__dirname, '..', '..', 'contract.md'),
];
const contractPath = contractCandidates.find((candidate) => fs.existsSync(candidate));
if (!contractPath) {
  console.error('Cannot find contract.md next to validate-output.js.');
  process.exit(2);
}
const contract = fs.readFileSync(contractPath, 'utf8');

function readContractInteger(field) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = contract.match(
    new RegExp('\\|\\s*`' + escapedField + '`\\s*\\|\\s*(\\d+)\\s*\\|')
  );
  if (!match) {
    throw new Error(`Missing numeric contract field: ${field}`);
  }
  const value = Number.parseInt(match[1], 10);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid numeric contract field: ${field}`);
  }
  return value;
}

const CONFIG = {
  chapterCountMin: readContractInteger('chapterCountMin'),
  chapterCountMax: readContractInteger('chapterCountMax'),
  activeModulesMin: readContractInteger('activeModulesMin'),
  dualModuleChaptersMin: readContractInteger('dualModuleChaptersMin'),
};

function fail(msg) {
  console.error('  ✗ ' + msg);
  return false;
}
function ok(msg) {
  console.log('  ✓ ' + msg);
  return true;
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

// Best-effort helpers below keep string/template content visible so URLs and copy survive when
// scanning for placeholders. Real syntax checking is delegated to syntax-check.js.
function stripComments(s) {
  let out = '';
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') { out += c; i++; continue; }
      if (c === inStr) inStr = null;
      out += c;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; continue; }
    if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && s[i + 1] === '*') {
      const j = s.indexOf('*/', i + 2);
      i = j < 0 ? s.length : j + 1;
      continue;
    }
    out += c;
  }
  return out;
}

/* Removed: the previous best-effort bracesBalanced() heuristic. syntax-check.js runs a real
 * TypeScript/esbuild parse over every source file instead of counting brackets. */

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/validate-output.js <path-to>/<paper-short-name>_output');
    process.exit(2);
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error('Not a directory: ' + dir);
    process.exit(2);
  }

  console.log('Validating React + TS project folder: ' + dir);
  let allPass = true;

  // --- 1. required files exist ---
  const keyFiles = [
    'package.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'src/main.tsx',
    'src/App.tsx',
    'src/types.ts',
    'src/data/tutorial.ts',
    'src/styles/tokens.css',
    'src/styles/components.css',
    'src/styles/paper.css',
    'src/modules/registry.tsx',
  ];
  for (const f of keyFiles) {
    if (readSafe(path.join(dir, f)) === null) {
      allPass = fail('missing required file: ' + f);
    } else {
      ok('present: ' + f);
    }
  }

  // --- read the content files ---
  const tutPath = path.join(dir, 'src/data/tutorial.ts');
  const tutRaw = readSafe(tutPath);
  if (tutRaw === null) {
    // already reported as missing above
  } else {
    // tutClean strips documentation comments so hint text mentioning `kind:"chapter"`
    // or `__XXX__` is not mistaken for data. paper.css is scanned RAW because its
    // `__METAPHOR_CSS__` placeholder intentionally lives inside a comment marker.
    const tut = stripComments(tutRaw);
    // --- 2 & 3. chapter / module / dual-module counts ---
    // Quote-tolerant: tutorial.ts may be hand-written (`kind: "chapter"`) or
    // assembled from JSON packets via JSON.stringify (`"kind": "chapter"`).
    const chapterCount = (tut.match(/["']?kind["']?\s*:\s*["']chapter["']/g) || []).length;
    const moduleCount = (tut.match(/["']?kind["']?\s*:\s*["']module["']/g) || []).length;

    const chapterBlocks = tut.split(/["']?kind["']?\s*:\s*["']chapter["']/);
    let dual = 0;
    for (let i = 1; i < chapterBlocks.length; i++) {
      const m = (chapterBlocks[i].match(/["']?kind["']?\s*:\s*["']module["']/g) || []).length;
      if (m >= 2) dual += 1;
    }

    if (chapterCount < CONFIG.chapterCountMin || chapterCount > CONFIG.chapterCountMax) {
      allPass = fail(
        `chapter count = ${chapterCount}, must be within [${CONFIG.chapterCountMin}, ${CONFIG.chapterCountMax}]`
      );
    } else {
      ok(`chapter count = ${chapterCount} (within [${CONFIG.chapterCountMin}, ${CONFIG.chapterCountMax}])`);
    }

    if (dual < CONFIG.dualModuleChaptersMin) {
      allPass = fail(
        `chapters with two modules = ${dual}, need >= ${CONFIG.dualModuleChaptersMin}`
      );
    } else {
      ok(`chapters with two modules = ${dual} (>= ${CONFIG.dualModuleChaptersMin})`);
    }

    if (moduleCount < CONFIG.activeModulesMin) {
      allPass = fail(`total active modules = ${moduleCount}, need >= ${CONFIG.activeModulesMin}`);
    } else {
      ok(`total active modules = ${moduleCount} (>= ${CONFIG.activeModulesMin})`);
    }

    // --- 4. leftover placeholders ---
    const phRe = /__[A-Za-z0-9_]+__|__METAPHOR_CSS__|\bTBD\b|\bTODO\b/;
    const paperCss = readSafe(path.join(dir, 'src/styles/paper.css')) || '';
    let moduleConcat = '';
    const modulesDir = path.join(dir, 'src/modules');
    if (fs.existsSync(modulesDir) && fs.statSync(modulesDir).isDirectory()) {
      for (const f of fs.readdirSync(modulesDir)) {
        if (f.endsWith('.ts') || f.endsWith('.tsx')) {
          moduleConcat += '\n' + (readSafe(path.join(modulesDir, f)) || '');
        }
      }
    }
    const scanTargets = [
      ['src/data/tutorial.ts', tut],
      ['src/styles/paper.css', paperCss],
      ['src/modules/*', moduleConcat],
    ];
    for (const [label, content] of scanTargets) {
      if (phRe.test(content)) {
        allPass = fail(`leftover template placeholder in ${label} (e.g. __XXX__, __METAPHOR_CSS__, TBD, TODO)`);
      } else {
        ok(`no leftover placeholders in ${label}`);
      }
    }

    // --- 5. Bilibili bvid check ---
    const bvidRe = /["']?bvid["']?\s*:\s*["']([^"']*)["']/g;
    let bm;
    let total = 0;
    let empty = 0;
    let bad = 0;
    while ((bm = bvidRe.exec(tut)) !== null) {
      total += 1;
      const v = bm[1].trim();
      if (!v) empty += 1;
      else if (!/^BV[0-9A-Za-z]+$/.test(v)) bad += 1;
    }
    if (total === 0) {
      ok('no Bilibili entries (videos optional — OK)');
    } else if (bad > 0) {
      allPass = fail(`${bad} Bilibili entry has an invalid bvid (expected BV...)`);
    } else if (empty > 0) {
      ok(`${empty} empty bvid tolerated (omit the entry or the whole array for no video)`);
    } else {
      ok(`all ${total} Bilibili entries have a valid bvid`);
    }

    // --- 6. componentId registration ---
    const registry = readSafe(path.join(dir, 'src/modules/registry.tsx')) || '';
    const compIds = [...tut.matchAll(/["']?componentId["']?\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const uniqueIds = [...new Set(compIds)];
    const unregistered = [];
    for (const id of uniqueIds) {
      if (id === 'example-slider') continue; // seeded in the scaffold
      const re = new RegExp(
        "widgetRegistry\\[['\"]" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]\\]"
      );
      if (!re.test(registry)) unregistered.push(id);
    }
    if (unregistered.length > 0) {
      allPass = fail(`componentId(s) not registered in registry.tsx: ${unregistered.join(', ')}`);
    } else {
      ok(`all ${uniqueIds.length} componentId(s) registered`);
    }

  }

  // --- 7. syntax parse of every project source file ---
  // The repository CI compiles each change with `tsc`/`vite`; this gate moves the same check into
  // the generation stage so a truncated widget is caught before a Pull Request. When dependencies
  // are not installed (the repository CI runs this before `npm ci`) the parser is unavailable and
  // the check is skipped here; CI's build:changed step still compiles the project.
  const syntaxReport = checkProject(dir);
  if (!syntaxReport.available) {
    console.log('  ! syntax check skipped: run `npm install` in the project to enable the parse gate');
  } else if (syntaxReport.errors.length > 0) {
    for (const error of syntaxReport.errors.slice(0, 20)) {
      allPass = fail(`${path.relative(dir, error.file).replace(/\\/g, '/')}:${error.line}:${error.column} ${error.message}`);
    }
    allPass = fail(`${syntaxReport.errors.length} syntax error(s) in project sources (checked with ${syntaxReport.parser})`);
  } else {
    ok(`all ${syntaxReport.files} source file(s) parse cleanly (${syntaxReport.parser})`);
  }

  console.log('');
  if (allPass) {
    console.log('RESULT: PASS');
    process.exit(0);
  } else {
    console.log('RESULT: FAIL');
    process.exit(1);
  }
}

main();
