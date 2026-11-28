'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { PAPER_NAME_RE, VERSION_NAME_RE, validateMetadata, versionRecord, catalogRecord } = require('../../../../scripts/lib/repository');

const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const OWNERSHIP_FILE = 'catalog/paperskill-ownership.json';
const OVERRIDES_FILE = 'catalog/paperskill-overrides.json';

function validKey(key) {
  const parts = key.split('/');
  return key === key.trim() && parts.length === 2 && PAPER_NAME_RE.test(parts[0]) && VERSION_NAME_RE.test(parts[1]);
}

function git(root, args, input) {
  const result = spawnSync('git', args, { cwd: root, input, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error('Git 撤回核对失败：' + (result.error?.message || result.stderr?.toString().trim() || args[0]));
  }
  return result.stdout;
}

function entriesAt(root, revision, paths) {
  const result = new Map();
  const output = git(root, ['ls-tree', '-r', '-z', '--full-tree', revision, '--', ...paths]);
  const fields = new TextDecoder('utf-8', { fatal: true }).decode(output).split('\0');
  if (fields.pop() !== '') throw new Error('Git 树输出不完整');
  for (const field of fields) {
    const row = /^(\d{6}) (blob|commit) ([0-9a-f]{40})\t([\s\S]+)$/.exec(field);
    if (!row || result.has(row[4])) throw new Error('Git 树条目异常');
    result.set(row[4], { mode: row[1], blob: row[3] });
  }
  return result;
}

function jsonBlobs(root, ids) {
  const unique = [...new Set(ids)];
  const output = git(root, ['cat-file', '--batch'], unique.join('\n') + '\n');
  const result = new Map();
  let offset = 0;
  for (const id of unique) {
    const newline = output.indexOf(10, offset);
    if (newline < 0) throw new Error('Git 元数据对象缺失');
    const header = /^([0-9a-f]{40}) blob (\d+)$/.exec(output.subarray(offset, newline).toString());
    if (!header || header[1] !== id) throw new Error('Git 元数据对象异常');
    const end = newline + 1 + Number(header[2]);
    if (output[end] !== 10) throw new Error('Git 元数据对象截断');
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(output.subarray(newline + 1, end));
    result.set(id, JSON.parse(raw));
    offset = end + 1;
  }
  if (offset !== output.length) throw new Error('Git 元数据响应包含多余内容');
  return result;
}

function regular(entry) {
  return entry && ['100644', '100755'].includes(entry.mode);
}

function cleanMetadata(meta, key) {
  const [paper, version] = key.split('/');
  const errors = validateMetadata(meta, paper, version);
  if (errors.length) throw new Error(key + '：' + errors.join('；'));
  return meta;
}

function loadSnapshot(root, revision) {
  if (!SHA.test(revision) || git(root, ['rev-parse', 'HEAD']).toString().trim() !== revision) {
    throw new Error('检出的提交与部署 SHA 不一致');
  }
  const entries = entriesAt(root, revision, ['html_output', OVERRIDES_FILE, OWNERSHIP_FILE]);
  const groups = new Map();
  for (const [name, entry] of entries) {
    if (!regular(entry)) throw new Error('网页清单存在非普通文件：' + name);
    if (name === 'html_output/README.md' || !name.startsWith('html_output/')) continue;
    const parts = name.split('/');
    const key = parts.slice(1, 3).join('/');
    if (parts.length < 4 || !validKey(key)) throw new Error('网页路径异常：' + name);
    if (!groups.has(key)) groups.set(key, {});
    const group = groups.get(key);
    if (parts.length === 4 && parts[3] === 'paper.json') group.meta = entry.blob;
    if (parts.length === 4 && parts[3] === 'index.html') group.entry = entry.blob;
  }
  if (!groups.size) throw new Error('仓库网页版本清单为空');
  for (const [key, files] of groups) {
    if (!files.meta || !files.entry) throw new Error('网页缺少 paper.json 或 index.html：' + key);
  }
  const configs = [OVERRIDES_FILE, OWNERSHIP_FILE].filter(file => entries.has(file));
  const values = jsonBlobs(root, [...[...groups.values()].map(value => value.meta),
    ...configs.map(file => entries.get(file).blob)]);
  return {
    versions: new Map([...groups].map(([key, files]) => [key, cleanMetadata(values.get(files.meta), key)])),
    overrides: entries.has(OVERRIDES_FILE) ? values.get(entries.get(OVERRIDES_FILE).blob) : {},
    ownership: entries.has(OWNERSHIP_FILE) ? values.get(entries.get(OWNERSHIP_FILE).blob) : null,
  };
}

function verifyArtifact(root, archive, snapshot, expectedZipSha256) {
  const py = process.platform === 'win32' ? 'py' : 'python3';
  const flags = process.platform === 'win32' ? ['-3'] : [];
  const result = spawnSync(py, [...flags, path.join(root, '.github', 'scripts', 'publication', 'read-pages-artifact.py'), archive, expectedZipSha256],
    { cwd: root, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' });
  if (result.status !== 0) throw new Error('不能验证 Pages 制品：' + (result.error?.message || result.stderr));
  const artifact = JSON.parse(result.stdout);
  const entries = new Map();
  const papers = new Set();
  for (const paper of artifact.catalog) {
    if (papers.has(paper.paperName) || !Array.isArray(paper.versions) || !paper.versions.length) {
      throw new Error('Pages 目录索引包含重复论文或缺少版本');
    }
    papers.add(paper.paperName);
    const versions = paper.versions.map((row) => {
      const key = paper.paperName + '/' + row.version;
      const meta = snapshot.versions.get(key);
      const pagePath = 'papers/' + key + '/';
      const indexHash = artifact.indexes['papers/' + key];
      if (!meta || entries.has(key) || !DIGEST.test(indexHash || '')) {
        throw new Error('Pages 目录索引与 Git 版本或网页入口不一致：' + key);
      }
      const expected = versionRecord(meta, { paperName: paper.paperName, version: row.version });
      if (!isDeepStrictEqual(expected, row)) throw new Error('Pages 版本元数据不一致：' + key);
      entries.set(key, { paper_name: paper.paperName, version_name: row.version,
        page_path: pagePath, index_sha256: indexHash });
      return expected;
    });
    const primary = versions.find(row => row.tutorialUrl === paper.tutorialUrl);
    const meta = primary && snapshot.versions.get(paper.paperName + '/' + primary.version);
    if (!meta || !isDeepStrictEqual(paper, catalogRecord(paper, versions, meta))) {
      throw new Error('Pages 论文元数据不一致：' + paper.paperName);
    }
  }
  if (entries.size !== snapshot.versions.size || entries.size !== Object.keys(artifact.indexes).length ||
      !DIGEST.test(artifact.tar_sha256)) throw new Error('Pages 制品清单不完整');
  return { artifact_sha256: artifact.tar_sha256, versions: [...entries.values()] };
}

function removalEvidence(root, revision, key) {
  if (!validKey(key)) throw new Error('账本版本键异常');
  const directory = 'html_output/' + key;
  if (entriesAt(root, revision, [directory]).size) return null;
  // The latest first-parent change must remove the whole subtree. A merge or
  // squash has the same evidence as any other commit that drops a version.
  const commit = git(root, ['log', '-1', '--first-parent', '--full-history', '--format=%H',
    revision, '--', directory + '/']).toString().trim();
  if (!SHA.test(commit) || entriesAt(root, commit, [directory]).size) return null;
  const parent = git(root, ['rev-parse', '--verify', commit + '^1']).toString().trim();
  if (!SHA.test(parent)) return null;
  const before = entriesAt(root, parent, [directory, OVERRIDES_FILE]);
  const metadata = before.get(directory + '/paper.json');
  if (!regular(metadata) || !regular(before.get(directory + '/index.html'))) return null;
  const overrideEntry = before.get(OVERRIDES_FILE);
  if (overrideEntry && !regular(overrideEntry)) throw new Error('历史覆盖文件异常');
  const values = jsonBlobs(root, [metadata.blob, ...(overrideEntry ? [overrideEntry.blob] : [])]);
  return {
    meta: cleanMetadata(values.get(metadata.blob), key),
    override: overrideEntry ? (values.get(overrideEntry.blob)[key] || {}) : {},
    evidence: { deletion_commit: commit, previous_commit: parent, directory: directory + '/',
      removed_paths: [...before.keys()].filter(name => name.startsWith(directory + '/')).sort() },
  };
}

function restorationEvidence(root, revision, key, withdrawnAt) {
  const directory = 'html_output/' + key;
  const ancestor = git(root, ['merge-base', withdrawnAt, revision]).toString().trim();
  if (ancestor !== withdrawnAt || entriesAt(root, withdrawnAt, [directory]).size) return null;
  const metaPath = directory + '/paper.json';
  const candidates = git(root, ['log', '--first-parent', '--full-history', '--format=%H',
    withdrawnAt + '..' + revision, '--', metaPath]).toString().trim().split(/\r?\n/);
  for (const commit of candidates.filter(sha => SHA.test(sha))) {
    if (!regular(entriesAt(root, commit, [metaPath]).get(metaPath))) continue;
    const parent = git(root, ['rev-parse', '--verify', commit + '^1']).toString().trim();
    if (!entriesAt(root, parent, [directory]).size) {
      return { withdrawn_at_commit: withdrawnAt, restored_at_commit: commit, restored_at_deployment: revision,
        directory: directory + '/' };
    }
  }
  return null;
}

module.exports = { SHA, validKey, loadSnapshot, verifyArtifact, removalEvidence, restorationEvidence };
