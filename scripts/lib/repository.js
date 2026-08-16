'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_ROOT = path.join(ROOT, 'html_output');
const PAPER_NAME_RE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} 不是有效 JSON：${error.message}`);
  }
}

function listSubmissions() {
  if (!fs.existsSync(OUTPUT_ROOT)) return [];
  return fs.readdirSync(OUTPUT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({ paperName: entry.name, dir: path.join(OUTPUT_ROOT, entry.name) }))
    .sort((a, b) => a.paperName.localeCompare(b.paperName));
}

function validateMetadata(meta, expectedPaperName) {
  const errors = [];
  const requiredStrings = ['paperName', 'title', 'paperUrl', 'skillVersion', 'status', 'entry'];
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return ['paper.json 必须是对象'];
  if (meta.schemaVersion !== 1) errors.push('schemaVersion 必须为 1');
  for (const key of requiredStrings) {
    if (typeof meta[key] !== 'string' || meta[key].trim() === '') errors.push(`${key} 必须是非空字符串`);
  }
  if (!PAPER_NAME_RE.test(meta.paperName || '')) errors.push('paperName 必须为小写字母、数字和下划线，且以下划线连接单词（论文全称）');
  if (meta.paperName !== expectedPaperName) errors.push(`paperName 必须与目录名一致（期望 ${expectedPaperName}）`);
  if (!/^https:\/\//.test(meta.paperUrl || '')) errors.push('paperUrl 必须是 https:// 链接');
  if (!/^\d+\.\d+\.\d+$/.test(meta.skillVersion || '')) errors.push('skillVersion 必须是 x.y.z');
  if (!['draft', 'review', 'published'].includes(meta.status)) errors.push('status 必须是 draft、review 或 published');
  if (meta.entry !== 'index.html') errors.push('entry 必须是 index.html');
  if (!Array.isArray(meta.participants) || meta.participants.length === 0) {
    errors.push('participants 至少包含一位参与者');
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

function catalogRecord(meta) {
  return {
    paperName: meta.paperName,
    title: meta.title,
    authors: meta.authors || [],
    year: meta.year ?? null,
    venue: meta.venue || '',
    paperUrl: meta.paperUrl,
    participants: meta.participants,
    topics: meta.topics,
    skillVersion: meta.skillVersion,
    status: meta.status,
    tutorialUrl: `papers/${meta.paperName}/`,
  };
}

module.exports = { ROOT, OUTPUT_ROOT, PAPER_NAME_RE, readJson, listSubmissions, validateMetadata, metadataFor, catalogRecord };
