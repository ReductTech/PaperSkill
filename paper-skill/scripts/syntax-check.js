#!/usr/bin/env node
/*
 * syntax-check.js — shared compile-time syntax gate for paper-skill output.
 *
 * Purpose: move the syntax check that used to happen only in the repository CI
 * (`tsc --noEmit` + `vite build`, see scripts/build-all.js) forward into the skill's own
 * generation / assembly stage, so a truncated or unbalanced widget file is rejected before it
 * can ever reach a Pull Request.
 *
 * The checker uses a real parser, never a hand-rolled balance heuristic:
 *   - TypeScript (`<project>/node_modules/typescript`, the template devDependency) is preferred;
 *   - esbuild (ships with Vite) is used when TypeScript is unavailable.
 * Both are present in the output project after `npm install`, so the gate reports real syntax
 * diagnostics (missing brackets, truncated files, unterminated strings, and so on).
 *
 * When neither dependency is installed the checker reports `parser: 'unavailable'` instead of
 * guessing. Callers decide the policy: the assembly step warns, while
 * `node syntax-check.js <dir> --require-parser` fails hard (used by the Phase 2 checklist).
 *
 * CLI:
 *   node syntax-check.js <project-dir> [--require-parser]
 * Exits 0 on pass, 1 on syntax errors, 2 on usage error, 3 when a parser is required but absent.
 *
 * Programmatic API:
 *   const { checkProject, checkFiles, checkSource } = require('./syntax-check.js');
 *   checkProject(dir) -> { parser, files, errors: [{ file, line, column, message }] }
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'dist-ssr', 'site', '.git', 'coverage']);
const DEFAULT_ROOTS = ['src'];
const ROOT_CONFIG_FILES = ['vite.config.ts', 'vite.config.mts', 'vite.config.js'];

// ---------------------------------------------------------------------------
// Parser discovery
// ---------------------------------------------------------------------------

const parserCache = new Map();

function resolveFrom(fromDir, name) {
  try {
    return require(require.resolve(name, { paths: [fromDir] }));
  } catch (error) {
    /* fall through to the explicit node_modules walk */
  }
  let dir = path.resolve(fromDir);
  for (let depth = 0; depth < 10; depth += 1) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(candidate)) {
      try {
        return require(candidate);
      } catch (error) {
        /* keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function resolveParser(projectDir) {
  const key = path.resolve(projectDir);
  if (parserCache.has(key)) return parserCache.get(key);

  let parser = { name: 'unavailable', engine: null };
  const typescript = resolveFrom(key, 'typescript');
  if (typescript && typeof typescript.transpileModule === 'function') {
    parser = { name: 'typescript', engine: typescript };
  } else {
    const esbuild = resolveFrom(key, 'esbuild');
    if (esbuild && typeof esbuild.transformSync === 'function') {
      parser = { name: 'esbuild', engine: esbuild };
    }
  }
  parserCache.set(key, parser);
  return parser;
}

// ---------------------------------------------------------------------------
// Parser back ends
// ---------------------------------------------------------------------------

function locate(source, index) {
  const end = Math.max(0, Math.min(typeof index === 'number' ? index : 0, source.length));
  let line = 1;
  let column = 1;
  for (let i = 0; i < end; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function parseWithTypescript(ts, fileName, source) {
  const output = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      allowJs: true,
      checkJs: false,
      isolatedModules: true,
      noResolve: true,
      skipLibCheck: true,
      sourceMap: false,
    },
  });
  return (output.diagnostics || []).map((diagnostic) => {
    const position = locate(source, diagnostic.start);
    return {
      line: position.line,
      column: position.column,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
    };
  });
}

function esbuildLoader(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.tsx') return 'tsx';
  if (ext === '.ts' || ext === '.mts' || ext === '.cts') return 'ts';
  if (ext === '.jsx') return 'jsx';
  return 'js';
}

function parseWithEsbuild(esbuild, fileName, source) {
  try {
    esbuild.transformSync(source, {
      loader: esbuildLoader(fileName),
      format: 'esm',
      sourcefile: fileName,
    });
    return [];
  } catch (error) {
    if (error && Array.isArray(error.errors) && error.errors.length > 0) {
      return error.errors.map((item) => ({
        line: item.location && item.location.line ? item.location.line : 1,
        column: item.location && item.location.column ? item.location.column : 1,
        message: item.location && item.location.lineText
          ? `${item.text} (${item.location.lineText.trim()})`
          : item.text,
      }));
    }
    return [{ line: 1, column: 1, message: error && error.message ? error.message : String(error) }];
  }
}

function parse(parser, fileName, source) {
  if (parser.name === 'typescript') return parseWithTypescript(parser.engine, fileName, source);
  if (parser.name === 'esbuild') return parseWithEsbuild(parser.engine, fileName, source);
  return [];
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function collectSourceFiles(projectDir, roots = DEFAULT_ROOTS) {
  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  for (const root of roots) walk(path.join(projectDir, root));
  results.sort();
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function checkSource(fileName, source, options = {}) {
  const projectDir = options.projectDir || path.dirname(fileName);
  const parser = resolveParser(projectDir);
  const errors = parse(parser, fileName, source).map((error) => ({
    file: fileName,
    line: error.line,
    column: error.column,
    message: error.message,
  }));
  return { parser: parser.name, available: parser.name !== 'unavailable', errors };
}

function checkFiles(filePaths, options = {}) {
  const projectDir = options.projectDir
    || (filePaths[0] ? path.dirname(filePaths[0]) : process.cwd());
  const parser = resolveParser(projectDir);
  if (parser.name === 'unavailable') {
    return { parser: parser.name, available: false, files: filePaths.length, errors: [] };
  }
  const errors = [];
  for (const filePath of filePaths) {
    // TypeScript 的 transpileModule 无法处理声明文件：.d.ts 输入在 emit 阶段不产出任何文件，
    // 会让 transpileModule 抛 Debug Failure. Output generation failed。这类文件只有类型信息，
    // 真正的类型检查由 tsc（npm run build）负责，这里跳过。
    if (filePath.toLowerCase().endsWith('.d.ts')) continue;
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      errors.push({ file: filePath, line: 1, column: 1, message: `cannot read file: ${error.message}` });
      continue;
    }
    for (const error of parse(parser, filePath, source)) {
      errors.push({ file: filePath, line: error.line, column: error.column, message: error.message });
    }
  }
  return { parser: parser.name, available: parser.name !== 'unavailable', files: filePaths.length, errors };
}

function checkFile(filePath, options = {}) {
  return checkFiles([filePath], { projectDir: options.projectDir || path.dirname(filePath) });
}

function checkProject(projectDir, options = {}) {
  const parser = resolveParser(projectDir);
  if (parser.name === 'unavailable') {
    return { parser: parser.name, available: false, files: 0, errors: [] };
  }
  const files = collectSourceFiles(projectDir, options.roots || DEFAULT_ROOTS);
  for (const config of ROOT_CONFIG_FILES) {
    const configPath = path.join(projectDir, config);
    if (fs.existsSync(configPath)) files.push(configPath);
  }
  return checkFiles(files, { projectDir });
}

function formatErrors(errors, projectDir) {
  return errors.map((error) => {
    const relative = projectDir
      ? path.relative(projectDir, error.file).replace(/\\/g, '/') || error.file
      : error.file;
    const at = error.line ? `:${error.line}:${error.column}` : '';
    return `  ✗ ${relative}${at} ${error.message}`;
  });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const requireParser = args.includes('--require-parser');
  const target = args.find((arg) => !arg.startsWith('--'));
  if (!target) {
    console.error('Usage: node syntax-check.js <project-dir> [--require-parser]');
    process.exit(2);
  }
  const projectDir = path.resolve(target);
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    console.error(`Not a directory: ${projectDir}`);
    process.exit(2);
  }

  const report = checkProject(projectDir);
  if (!report.available) {
    console.error(`Syntax check unavailable: no TypeScript or esbuild found under ${projectDir}.`);
    console.error('Run `npm install` in the project directory, then re-run this check.');
    process.exit(requireParser ? 3 : 0);
  }

  console.log(`Syntax check (${report.parser}) over ${report.files} source file(s): ${projectDir}`);
  for (const line of formatErrors(report.errors, projectDir)) console.error(line);
  if (report.errors.length > 0) {
    console.error(`RESULT: FAIL — ${report.errors.length} syntax error(s)`);
    process.exit(1);
  }
  console.log('RESULT: PASS');
  process.exit(0);
}

if (require.main === module) main();

module.exports = {
  SOURCE_EXTENSIONS,
  collectSourceFiles,
  checkSource,
  checkFile,
  checkFiles,
  checkProject,
  resolveParser,
  formatErrors,
};
