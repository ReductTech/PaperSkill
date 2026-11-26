'use strict';

const { spawnSync } = require('node:child_process');
const { TextDecoder } = require('node:util');
const { ROOT, PAPER_NAME_RE, VERSION_NAME_RE, validateMetadata } = require('../../scripts/lib/repository');
const { githubParticipantErrors } = require('../../scripts/lib/github-identity');

const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const requiredFiles = [
  'paper.json', 'README.md', 'package.json', 'package-lock.json', 'index.html',
  'vite.config.ts', 'tsconfig.json', 'src/main.tsx', 'src/App.tsx', 'src/data/tutorial.ts',
  'src/modules/registry.tsx', 'src/styles/paper.css',
];
const forbiddenDirectories = new Set(['node_modules', 'dist', 'dist-ssr']);

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) {
    const detail = result.error?.message || result.stderr?.toString().trim() || result.signal;
    throw new Error('Git 查询失败 ' + args[0] + '：' + detail);
  }
  return utf8.decode(result.stdout);
}

function revision(root, ref) {
  if (!ref) throw new Error('缺少 Git 基线或目标提交');
  return git(root, ['rev-parse', '--verify', '--end-of-options', ref + '^{commit}']).trim();
}

function fields(output) {
  if (!output) return [];
  const parts = output.split('\0');
  if (parts.pop() !== '' || parts.some(part => !part)) throw new Error('Git NUL 分隔输出不完整');
  return parts;
}

function tree(root, sha) {
  const entries = new Map();
  for (const field of fields(git(root, ['ls-tree', '-rz', '--full-tree', sha, '--', 'html_output']))) {
    const row = /^(\d{6}) (blob|commit) ([a-f0-9]+)\t([\s\S]+)$/.exec(field);
    if (!row || entries.has(row[4])) throw new Error('Git 树条目无法解析');
    entries.set(row[4], { mode: row[1], blob: row[3] });
  }
  return entries;
}

function versionKey(file) {
  const parts = file.split('/');
  const [, paper, version] = parts;
  if (parts.length < 4 || parts[0] !== 'html_output' || paper !== paper.trim() ||
      version !== version.trim() || !PAPER_NAME_RE.test(paper) || !VERSION_NAME_RE.test(version)) return null;
  return parts.slice(0, 3).join('/');
}

function ordinaryFile(entry) {
  return entry && (entry.mode === '100644' || entry.mode === '100755');
}

function validatePaperFormat(root, base, head) {
  const target = revision(root, head);
  const ancestor = git(root, ['merge-base', revision(root, base), target]).trim();
  // Treat a rename as deletion of its old path and addition of its new path.
  const changes = fields(git(root, ['diff', '--name-status', '-z', '--no-renames',
    '--no-ext-diff', '--ignore-submodules=none', ancestor, target, '--', 'html_output']));
  if (!changes.length) return { versions: [], errors: [] };

  const before = tree(root, ancestor);
  const after = tree(root, target);
  const surviving = new Map();
  for (const file of after.keys()) {
    const key = versionKey(file);
    if (!key) continue;
    if (!surviving.has(key)) surviving.set(key, []);
    surviving.get(key).push(file);
  }

  const versions = new Set();
  const editedMetadata = new Set();
  const errors = [];
  for (let index = 0; index < changes.length; index += 2) {
    const [status, file] = changes.slice(index, index + 2);
    if (!/^[ADMT]$/.test(status) || !file) throw new Error('Git Diff 状态无法解析');
    const key = versionKey(file);
    if (status === 'D') {
      if (key && surviving.has(key) && ordinaryFile(before.get(key + '/paper.json'))) versions.add(key);
      continue;
    }
    if (!key && file !== 'html_output/README.md') {
      errors.push(JSON.stringify(file) + '：请将论文文件提交到 html_output/<paper-name>/<version>/<file>');
    } else if (!ordinaryFile(after.get(file))) {
      errors.push(JSON.stringify(file) + '：必须是普通文件');
    } else if (key) {
      versions.add(key);
      if (file === key + '/paper.json') editedMetadata.add(key);
    }
  }

  for (const key of versions) {
    for (const file of requiredFiles) {
      if (!ordinaryFile(after.get(key + '/' + file))) errors.push(key + '：缺少普通文件 ' + file);
    }
    for (const file of surviving.get(key)) {
      if (file.slice(key.length + 1).split('/').some(part => forbiddenDirectories.has(part))) {
        errors.push('不应提交 ' + JSON.stringify(file));
      }
    }
    const entry = after.get(key + '/paper.json');
    if (!ordinaryFile(entry)) continue;

    let meta;
    try {
      meta = JSON.parse(git(root, ['cat-file', 'blob', entry.blob]));
    } catch (error) {
      errors.push(key + '/paper.json：' + error.message);
      continue;
    }
    const [, paper, version] = key.split('/');
    const issues = validateMetadata(meta, paper, version);
    if (editedMetadata.has(key)) issues.push(...githubParticipantErrors(meta));
    for (const issue of issues) errors.push(key + '/paper.json：' + issue);
  }
  return { versions: [...versions].sort(), errors };
}

if (require.main === module) {
  try {
    const { versions, errors } = validatePaperFormat(ROOT, process.argv[2], process.argv[3]);
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('论文格式校验通过。检查版本：' + (versions.join(', ') || '无'));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { validatePaperFormat };
