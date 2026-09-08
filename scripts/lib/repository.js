'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_ROOT = path.join(ROOT, 'html_output');
const PAPER_NAME_RE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
// 版本目录名：姓名拼音小写 + 修改日期 MMDD，同一人同一天重复提交追加 _2、_3
const VERSION_NAME_RE = /^[a-z][a-z0-9]*\d{4}(?:_\d+)?$/;
const VERSION_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} 不是有效 JSON：${error.message}`);
  }
}

function isVisibleDir(entry) {
  return entry.isDirectory() && !entry.name.startsWith('.');
}

/** 论文目录：html_output/<paper-name>/ */
function listPapers() {
  if (!fs.existsSync(OUTPUT_ROOT)) return [];
  return fs.readdirSync(OUTPUT_ROOT, { withFileTypes: true })
    .filter(isVisibleDir)
    .map((entry) => ({ paperName: entry.name, dir: path.join(OUTPUT_ROOT, entry.name) }))
    .filter((paper) => PAPER_NAME_RE.test(paper.paperName))
    .sort((a, b) => a.paperName.localeCompare(b.paperName));
}

/** 版本目录：html_output/<paper-name>/<pinyin><MMDD>/，以存在 paper.json 作为判据 */
function listVersions(paper) {
  if (!fs.existsSync(paper.dir)) return [];
  return fs.readdirSync(paper.dir, { withFileTypes: true })
    .filter(isVisibleDir)
    .filter((entry) => fs.existsSync(path.join(paper.dir, entry.name, 'paper.json')))
    .map((entry) => ({ paperName: paper.paperName, version: entry.name, dir: path.join(paper.dir, entry.name) }))
    .filter((item) => VERSION_NAME_RE.test(item.version))
    .sort((a, b) => a.version.localeCompare(b.version));
}

/** 展开后的版本列表，供遍历构建与校验使用 */
function listSubmissions() {
  return listPapers().flatMap((paper) => listVersions(paper));
}

function findPaper(paperName) {
  return listPapers().find((paper) => paper.paperName === paperName) || null;
}

function findVersion(paperName, version) {
  const paper = findPaper(paperName);
  if (!paper) return null;
  return listVersions(paper).find((item) => item.version === version) || null;
}

/**
 * 解析 "paper" 或 "paper/version"：
 * - 只给论文名时返回该论文的全部版本
 * - 给出版本时只返回该版本
 */
function resolveSubmissions(target) {
  const [paperName, version] = target.split('/');
  const paper = findPaper(paperName);
  if (!paper) return [];
  const versions = listVersions(paper);
  return version ? versions.filter((item) => item.version === version) : versions;
}

function validateMetadata(meta, expectedPaperName, expectedVersion) {
  const errors = [];
  const requiredStrings = ['paperName', 'title', 'paperUrl', 'skillVersion', 'status', 'entry'];
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return ['paper.json 必须是对象'];
  if (meta.schemaVersion !== 1) errors.push('schemaVersion 必须为 1');
  for (const key of requiredStrings) {
    if (typeof meta[key] !== 'string' || meta[key].trim() === '') errors.push(`${key} 必须是非空字符串`);
  }
  if (!PAPER_NAME_RE.test(meta.paperName || '')) errors.push('paperName 必须为小写字母、数字和下划线，且以下划线连接单词（论文全称）');
  if (meta.paperName !== expectedPaperName) errors.push(`paperName 必须与论文目录名一致（期望 ${expectedPaperName}）`);
  if (!/^https:\/\//.test(meta.paperUrl || '')) errors.push('paperUrl 必须是 https:// 链接');
  if (!/^\d+\.\d+\.\d+$/.test(meta.skillVersion || '')) errors.push('skillVersion 必须是 x.y.z');
  if (!['draft', 'review', 'published'].includes(meta.status)) errors.push('status 必须是 draft、review 或 published');
  if (meta.entry !== 'index.html') errors.push('entry 必须是 index.html');
  if (typeof meta.version !== 'string' || !VERSION_NAME_RE.test(meta.version || '')) {
    errors.push('version 必须是姓名拼音小写加修改日期 MMDD（例如 liming0903）');
  } else if (expectedVersion && meta.version !== expectedVersion) {
    errors.push(`version 必须与版本目录名一致（期望 ${expectedVersion}）`);
  }
  if (meta.versionDate !== undefined && meta.versionDate !== null && !VERSION_DATE_RE.test(meta.versionDate || '')) {
    errors.push('versionDate 必须是 YYYY-MM-DD 或 null');
  }
  if (!Array.isArray(meta.participants) || meta.participants.length === 0) {
    errors.push('participants 至少包含一位创建者');
  } else {
    meta.participants.forEach((item, index) => {
      if (!item || typeof item.name !== 'string' || !item.name.trim()) errors.push(`participants[${index}].name 不能为空`);
    });
  }
  if (!Array.isArray(meta.topics)) errors.push('topics 必须是数组');
  if (meta.year !== undefined && meta.year !== null && (!Number.isInteger(meta.year) || meta.year < 1900 || meta.year > 2100)) {
    errors.push('year 必须是 1900–2100 的整数或 null');
  }
  return errors;
}

function metadataFor(submission) {
  const file = path.join(submission.dir, 'paper.json');
  if (!fs.existsSync(file)) throw new Error(`${path.relative(ROOT, file)} 不存在`);
  return readJson(file);
}

function versionRecord(meta, submission) {
  return {
    version: meta.version,
    versionDate: meta.versionDate ?? null,
    participants: meta.participants,
    skillVersion: meta.skillVersion,
    status: meta.status,
    tutorialUrl: `papers/${submission.paperName}/${submission.version}/`,
  };
}

/** 主版本：优先已发布，其次修改日期最新，最后按版本名排序 */
function primaryVersion(versions) {
  return [...versions].sort((a, b) => {
    if ((a.status === 'published') !== (b.status === 'published')) return a.status === 'published' ? -1 : 1;
    const dateA = a.versionDate || '';
    const dateB = b.versionDate || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return b.version.localeCompare(a.version);
  })[0];
}

function catalogRecord(paper, versions, primaryMeta) {
  const primary = primaryVersion(versions);
  return {
    paperName: paper.paperName,
    title: primaryMeta.title,
    authors: primaryMeta.authors || [],
    year: primaryMeta.year ?? null,
    venue: primaryMeta.venue || '',
    paperUrl: primaryMeta.paperUrl,
    topics: primaryMeta.topics,
    participants: primary.participants,
    skillVersion: primary.skillVersion,
    status: primary.status,
    tutorialUrl: primary.tutorialUrl,
    versions,
  };
}

/** 聚合全部论文及其版本，生成 catalog/papers.json 记录 */
function catalogRecords() {
  const records = [];
  for (const paper of listPapers()) {
    const submissions = listVersions(paper);
    if (submissions.length === 0) continue;
    const versions = submissions.map((submission) => versionRecord(metadataFor(submission), submission));
    const primary = primaryVersion(versions);
    const primaryMeta = metadataFor(submissions.find((submission) => submission.version === primary.version));
    records.push(catalogRecord(paper, versions, primaryMeta));
  }
  return records;
}

module.exports = {
  ROOT,
  OUTPUT_ROOT,
  PAPER_NAME_RE,
  VERSION_NAME_RE,
  readJson,
  listPapers,
  listVersions,
  listSubmissions,
  findPaper,
  findVersion,
  resolveSubmissions,
  validateMetadata,
  metadataFor,
  versionRecord,
  catalogRecord,
  catalogRecords,
};
