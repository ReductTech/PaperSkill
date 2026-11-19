#!/usr/bin/env node
'use strict';

// Only repository metadata is read. Tutorial packages and build scripts are never executed here.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { ROOT, listSubmissions, metadataFor } = require('./lib/repository');

const DEFAULT_BASE_URL = 'https://app.reduct.cn';
const COPIED_DATABASE_ENDPOINT = 'https://php-testbed-lyx.reduct.cn/Web/V1/Paperskill/create_version';
const PRODUCTION_ENDPOINT = 'https://app.reduct.cn/Web/V1/Paperskill/create_version';
const STATE_FILE = 'paperskill-sync-state.json';
const OVERRIDE_FIELDS = new Set(['arxiv_id', 'doi', 'user_display_name', 'user_github_name', 'uuid', 'remote_id', 'confirmed_missing_fingerprint']);

function endpointFor(base) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('PAPERSKILL_API_BASE_URL 必须是 HTTPS 服务器根地址，不含凭据、路径或查询参数');
  }
  return new URL('/Web/V1/Paperskill/create_version', url).href;
}

function paperIdentifier(paperUrl) {
  const url = new URL(paperUrl);
  const pathname = decodeURIComponent(url.pathname);
  if (['arxiv.org', 'www.arxiv.org', 'export.arxiv.org'].includes(url.hostname)) {
    const id = pathname.replace(/^\/(abs|pdf|html)\//, '').replace(/\.pdf$/i, '').replace(/v\d+$/, '');
    if (/^(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z]{2})?\/\d{7})$/i.test(id)) return { arxiv_id: id };
  }
  if (['doi.org', 'dx.doi.org', 'www.doi.org'].includes(url.hostname)) {
    const doi = pathname.slice(1);
    if (/^10\.\d{4,9}\/\S+$/i.test(doi)) return { doi };
  }
  return {};
}

function payloadFor(submission, meta, override = {}, includeUuid = false) {
  for (const field of Object.keys(override)) {
    if (!OVERRIDE_FIELDS.has(field)) throw new Error(`不支持的覆盖字段 ${field}`);
  }
  if (override.remote_id !== undefined && (!Number.isSafeInteger(override.remote_id) || override.remote_id <= 0)) {
    throw new Error('remote_id 必须是对方已存在的版本正整数 ID');
  }
  if (override.confirmed_missing_fingerprint !== undefined && !/^[a-f0-9]{64}$/.test(override.confirmed_missing_fingerprint)) {
    throw new Error('confirmed_missing_fingerprint 必须是已确认未入库的旧请求 SHA-256');
  }
  if (meta.paperName !== submission.paperName || meta.version !== submission.version) throw new Error('版本元数据与目录不一致');
  if (!Array.isArray(meta.participants) || meta.participants.length !== 1) throw new Error('接口仅有一组作者字段，需要明确唯一贡献者');
  const participant = meta.participants[0];
  const payload = {
    version_name: submission.version,
    version_date: meta.versionDate,
    user_display_name: override.user_display_name ?? participant.name,
    user_github_name: String(override.user_github_name ?? participant.github ?? '').trim().replace(/^@/, ''),
    page_path: `papers/${submission.paperName}/${submission.version}/`,
  };
  for (const key of ['version_name', 'version_date', 'user_display_name', 'user_github_name']) {
    if (typeof payload[key] !== 'string' || !payload[key].trim()) throw new Error(`缺少 ${key}`);
  }
  const date = new Date(`${payload.version_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.version_date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== payload.version_date) {
    throw new Error('version_date 必须是真实的 YYYY-MM-DD 日期');
  }
  const identifier = override.arxiv_id !== undefined || override.doi !== undefined
    ? { arxiv_id: override.arxiv_id, doi: override.doi }
    : paperIdentifier(meta.paperUrl);
  const arxivId = identifier.arxiv_id;
  const doi = identifier.doi;
  if (!arxivId) throw Object.assign(new Error('没有明确的 arxiv_id，按入库策略自动跳过（仅有 DOI 也不提交）'), { skip: 'missing_arxiv_id' });
  if (doi) throw new Error('需要唯一的 arxiv_id，不能同时指定 doi');
  if (typeof arxivId !== 'string' || !/^(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z]{2})?\/\d{7})$/i.test(arxivId)) throw new Error('arxiv_id 格式无效');
  payload.arxiv_id = arxivId;
  const uuid = override.uuid ?? (includeUuid ? participant.jianlunId : undefined);
  if (uuid !== undefined && uuid !== '') {
    if (typeof uuid !== 'string' || !uuid.trim()) throw new Error('uuid 必须为非空字符串');
    payload.uuid = uuid.trim();
  }
  if (meta.ancestors !== undefined && !Array.isArray(meta.ancestors)) throw new Error('ancestors 必须为数组');
  if (meta.ancestors?.length) {
    payload.ancestors = JSON.stringify(meta.ancestors.map((ancestor) => {
      if (typeof ancestor.github !== 'string' || !ancestor.github.trim() || typeof ancestor.version !== 'string' || !ancestor.version.trim()) {
        throw new Error('溯源记录缺少 github 或 version');
      }
      return { user_github_name: ancestor.github.trim().replace(/^@/, ''), version_name: ancestor.version };
    }));
  }
  if (meta.topics?.length) {
    if (!meta.topics.every((topic) => typeof topic === 'string' && topic.trim() && !topic.includes(','))) throw new Error('topics 必须是非空且不含英文逗号的字符串');
    payload.tags = meta.topics.map((topic) => topic.trim()).join(',');
  }
  return payload;
}

function fingerprint(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function planFor(submissions, overrides = {}, includeUuid = false, read = metadataFor) {
  const rows = new Map();
  for (const submission of submissions) {
    const key = `${submission.paperName}/${submission.version}`;
    try {
      const meta = read(submission);
      const payload = payloadFor(submission, meta, overrides[key], includeUuid);
      rows.set(key, {
        key, payload, fingerprint: fingerprint(payload), remoteId: overrides[key]?.remote_id,
        confirmedMissingFingerprint: overrides[key]?.confirmed_missing_fingerprint,
        dependencies: (meta.ancestors || []).map((ancestor) => `${submission.paperName}/${ancestor.version}`),
      });
    } catch (error) {
      rows.set(key, { key, error: error.message, ...(error.skip ? { skip: error.skip } : {}), dependencies: [] });
    }
  }
  // Original versions must exist in the remote database before their descendants.
  const result = [];
  const visited = new Set();
  const visiting = new Set();
  function visit(row) {
    if (visited.has(row.key)) return;
    if (visiting.has(row.key)) throw new Error(`溯源存在循环：${row.key}`);
    visiting.add(row.key);
    for (const key of row.dependencies) {
      if (rows.has(key)) visit(rows.get(key));
    }
    visiting.delete(row.key);
    visited.add(row.key);
    result.push(row);
  }
  for (const row of rows.values()) visit(row);
  return result;
}

function newState(endpoint) {
  return { schemaVersion: 1, endpoint, versions: {} };
}

function validateState(state, endpoint) {
  if (state.schemaVersion !== 1 || !state.versions || typeof state.versions !== 'object' || Array.isArray(state.versions)) throw new Error('同步状态格式不支持');
  // The API owner confirmed the test database, including IDs, was copied to production.
  // Retain successes, fingerprints and ambiguous attempts on the same state branch.
  if (state.endpoint === COPIED_DATABASE_ENDPOINT && endpoint === PRODUCTION_ENDPOINT) {
    state.domainMigration = { from: state.endpoint, to: endpoint, basis: 'api_owner_confirmed_database_copy' };
    state.endpoint = endpoint;
  }
  if (state.endpoint !== endpoint) throw new Error('接口地址与同步状态不一致；切换数据库须使用另一状态文件/分支，避免混用测试和正式 ID');
}

async function createVersion(endpoint, payload, headers = {}, fetchImpl = fetch) {
  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) body.set(key, value);
  // fetch generates multipart boundaries; do not set Content-Type manually.
  const response = await fetchImpl(endpoint, {
    method: 'POST', body, headers: { ...headers, Accept: 'application/json' },
    redirect: 'error', signal: AbortSignal.timeout(30000),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error(`接口响应不是 JSON (HTTP ${response.status})，结果需核对`); }
  // The API owner confirmed business code 404 means no matching paper and no version created.
  // An HTTP 404 or a contradictory response containing an ID remains ambiguous.
  if (response.status === 200 && data?.code === 404 && data.data?.id == null) {
    throw Object.assign(new Error('对方库未找到对应论文（业务 code 404），未入库；请核对或更换论文标识'), { paperNotFound: true });
  }
  if (!response.ok || data.code !== 200 || !Number.isSafeInteger(data.data?.id) || data.data.id <= 0) {
    // The response body may contain credentials or submitted metadata; do not log it.
    throw new Error(`接口未确认创建成功 (HTTP ${response.status}, code ${typeof data.code === 'number' ? data.code : 'invalid'})，结果需核对`);
  }
  return data.data.id;
}

async function synchronize({ plan, state, save, create, onResult = () => {} }) {
  const results = [];
  const byKey = new Map(plan.map(row => [row.key, row]));
  const skipped = new Set();
  let halted = false;
  for (const row of plan) {
    let result;
    const existing = state.versions[row.key];
    // Manual confirmation applies only to the exact old request, never a later ambiguous attempt.
    const confirmedMissing = ['pending', 'uncertain'].includes(existing?.status)
      && row.confirmedMissingFingerprint === existing.fingerprint && row.fingerprint !== existing.fingerprint;
    if (row.skip) {
      result = { key: row.key, status: 'skipped', skip_reason: row.skip, reason: row.error };
    } else if (row.error) {
      result = { key: row.key, status: 'blocked', reason: row.error };
    } else if (existing?.status === 'synced') {
      result = existing.fingerprint === row.fingerprint
        ? { key: row.key, status: 'unchanged', id: existing.id }
        : { key: row.key, status: 'blocked', reason: '已入库版本的元数据已变化；create_version 未说明支持更新，请使用新版本或让对方提供更新接口' };
    } else if (row.remoteId) {
      // An operator can reconcile a previously imported or ambiguous request using its real ID.
      state.versions[row.key] = { status: 'synced', id: row.remoteId, fingerprint: row.fingerprint, source: 'adopted' };
      result = { key: row.key, status: 'adopted', id: row.remoteId };
    } else if (existing?.status === 'not_found' && existing.fingerprint === row.fingerprint) {
      result = { key: row.key, status: 'skipped', skip_reason: 'paper_not_found', reason: '对方库未找到对应论文；请求未变化，暂不重复发送，请修正论文标识后再试' };
    } else if (existing && existing.status !== 'not_found' && !confirmedMissing) {
      result = { key: row.key, status: 'blocked', reason: '上次创建结果待核对，禁止自动重发；确认后用 remote_id 登记已有记录，或移除已确认未创建的状态项' };
    } else if (row.dependencies.some(key => state.versions[key]?.status !== 'synced'
        && (skipped.has(key) || byKey.get(key)?.skip || state.versions[key]?.status === 'not_found'))) {
      result = { key: row.key, status: 'skipped', skip_reason: 'ancestor_not_synced', reason: '祖先版本已按策略跳过，暂不提交依赖它的版本' };
    } else if (row.dependencies.some((key) => state.versions[key]?.status !== 'synced')) {
      result = { key: row.key, status: 'blocked', reason: '祖先版本尚未入库，请先补齐其元数据或登记已有 remote_id' };
    } else if (halted) {
      result = { key: row.key, status: 'deferred', reason: '本轮接口调用已失败，其他新版本留待修复后提交' };
    } else {
      // Persist intent BEFORE the POST. A crash after the server commits must never trigger a blind retry.
      state.versions[row.key] = { status: 'pending', fingerprint: row.fingerprint };
      await save(state);
      try {
        const id = await create(row.payload);
        state.versions[row.key] = { status: 'synced', id, fingerprint: row.fingerprint };
        result = { key: row.key, status: 'created', id };
      } catch (error) {
        const status = error.paperNotFound ? 'not_found' : 'uncertain';
        if (!error.paperNotFound) halted = true;
        state.versions[row.key] = { status, fingerprint: row.fingerprint };
        result = error.paperNotFound
          ? { key: row.key, status: 'skipped', skip_reason: 'paper_not_found', reason: error.message }
          : { key: row.key, status, reason: error.message };
      }
    }
    results.push(result);
    if (result.status === 'skipped') skipped.add(row.key);
    onResult(result);
  }
  await save(state);
  return results;
}

function localStore(filename, endpoint) {
  return {
    async load() { return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : newState(endpoint); },
    async save(state) {
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(`${filename}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
      fs.renameSync(`${filename}.tmp`, filename);
    },
  };
}

function githubStore({ repository, token, branch, endpoint, apiBase = 'https://api.github.com', fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !token) throw new Error('GitHub 状态存储需要 GITHUB_REPOSITORY 和 GITHUB_TOKEN');
  if (!/^[a-zA-Z0-9_-]+$/.test(branch) || branch === 'main' || branch === 'master') throw new Error('状态分支必须是独立的简单分支名');
  let sha;
  let loaded = false;
  let lastWrite = 0;
  let lastContent;
  const root = `${apiBase.replace(/\/$/, '')}/repos/${repository}`;
  function retryDelay(error, attempt) {
    return Math.max(Math.min(30000, 2000 * 2 ** attempt), error.retryAfter || 0);
  }
  async function requestOnce(suffix, method, body) {
    let response;
    try {
      response = await fetchImpl(`${root}${suffix}`, {
        method, redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw Object.assign(new Error('GitHub 状态存储网络请求失败；不会继续创建记录'), { retryable: true });
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      const retryAfter = response.headers.get('retry-after');
      const delay = /^\d+$/.test(retryAfter || '') ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now();
      throw Object.assign(new Error(`GitHub 状态存储 HTTP ${response.status}；${retryable ? '临时服务错误或限流' : '请检查权限、分支规则或写入冲突'}，不会继续创建记录`),
        { retryable, retryAfter: Number.isFinite(delay) ? Math.max(0, delay) : 0 });
    }
    try { return await response.json(); } catch {
      throw Object.assign(new Error('GitHub 状态存储响应无法解析；不会继续创建记录'), { retryable: true });
    }
  }
  async function request(suffix, method = 'GET', body) {
    for (let attempt = 0; ; attempt += 1) {
      try { return await requestOnce(suffix, method, body); } catch (error) {
        // Only reads are safe to retry here. Checkpoint writes reconcile below.
        if (method !== 'GET' || !error.retryable || attempt >= 3) throw error;
        await sleep(retryDelay(error, attempt));
      }
    }
  }
  return {
    async load() {
      const ref = await request(`/git/ref/heads/${branch}`);
      if (!ref) {
        const repo = await request('');
        const head = await request(`/git/ref/heads/${encodeURIComponent(repo.default_branch)}`);
        await request('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: head.object.sha });
      }
      const file = await request(`/contents/${STATE_FILE}?ref=${branch}`);
      if (ref && !file) throw new Error('已有状态分支缺少状态文件；请先恢复文件，不能按空状态重复导入');
      loaded = true;
      sha = file?.sha;
      const state = file ? JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) : newState(endpoint);
      if (file) lastContent = JSON.stringify(state, null, 2);
      return state;
    },
    async save(state) {
      if (!loaded) throw new Error('必须先读取同步状态');
      const content = JSON.stringify(state, null, 2);
      if (content === lastContent) return;
      // Each checkpoint is a commit; stay below GitHub's secondary write rate limit.
      await sleep(Math.max(0, 1500 - (Date.now() - lastWrite)));
      const body = {
        branch, message: 'chore: checkpoint PaperSkill database sync',
        content: Buffer.from(`${content}\n`).toString('base64'),
        ...(sha ? { sha } : {}),
      };
      for (let attempt = 0; ; attempt += 1) {
        try {
          const result = await request(`/contents/${STATE_FILE}`, 'PUT', body);
          if (!result?.content?.sha) throw Object.assign(new Error('无法确认同步状态已保存'), { retryable: true });
          sha = result.content.sha;
          break;
        } catch (error) {
          if (!error.retryable) throw error;
          await sleep(retryDelay(error, attempt));
          // A 503 or lost response may follow a committed PUT. Read back before retrying.
          const file = await request(`/contents/${STATE_FILE}?ref=${branch}`);
          const saved = file && JSON.stringify(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), null, 2);
          if (saved === content) {
            sha = file.sha;
            break;
          }
          if ((file?.sha || undefined) !== sha) throw new Error('GitHub 同步状态已被其他写入修改；停止以免覆盖');
          if (attempt >= 3) throw error;
        }
      }
      lastContent = content;
      lastWrite = Date.now();
    },
  };
}

function parseArgs(args) {
  const options = { apply: false, githubState: false, overrides: 'catalog/paperskill-overrides.json', state: 'tmp/paperskill-sync/state.json', report: 'tmp/paperskill-sync/report.json' };
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (name === '--apply') options.apply = true;
    else if (name === '--github-state') options.githubState = true;
    else if (['--only', '--overrides', '--state', '--report'].includes(name) && args[index + 1]) options[name.slice(2)] = args[++index];
    else throw new Error(`未知参数 ${name}`);
  }
  return options;
}

async function main(args = process.argv.slice(2), env = process.env) {
  const options = parseArgs(args);
  const endpoint = endpointFor(env.PAPERSKILL_API_BASE_URL || DEFAULT_BASE_URL);
  const overrides = JSON.parse(fs.readFileSync(path.resolve(ROOT, options.overrides), 'utf8'));
  let plan = planFor(listSubmissions(), overrides, env.PAPERSKILL_INCLUDE_JIANLUN_UUID === 'true');
  if (options.only) {
    const keys = new Set();
    const byKey = new Map(plan.map((row) => [row.key, row]));
    function select(key) {
      if (keys.has(key)) return;
      if (!byKey.has(key)) throw new Error(`版本不存在：${key}`);
      keys.add(key);
      for (const parent of byKey.get(key).dependencies) select(parent);
    }
    select(options.only);
    plan = plan.filter((row) => keys.has(row.key));
  }
  const reportFile = path.resolve(ROOT, options.report);
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  let results = [];
  let fatalError;
  try {
    if (!options.apply) {
      // No network requests, state writes or UUID values in a preview.
      results = plan.map((row) => row.skip
        ? { key: row.key, status: 'skipped', skip_reason: row.skip, reason: row.error }
        : row.error
        ? { key: row.key, status: 'blocked', reason: row.error }
        : { key: row.key, status: 'ready', identifier: row.payload.arxiv_id || row.payload.doi, page_path: row.payload.page_path, dependencies: row.dependencies, adopt_id: row.remoteId });
    } else {
      const headers = JSON.parse(env.PAPERSKILL_API_HEADERS || '{}');
      if (!headers || typeof headers !== 'object' || Array.isArray(headers) || Object.values(headers).some((value) => typeof value !== 'string')) {
        throw new Error('PAPERSKILL_API_HEADERS 必须为字符串值组成的 JSON 对象');
      }
      if (Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) throw new Error('不要配置 Content-Type，multipart boundary 由 fetch 生成');
      const store = options.githubState
        ? githubStore({ repository: env.GITHUB_REPOSITORY, token: env.GITHUB_TOKEN, branch: env.PAPERSKILL_STATE_BRANCH || 'paperskill-sync-state', endpoint, apiBase: env.GITHUB_API_URL })
        : localStore(path.resolve(ROOT, options.state), endpoint);
      const state = await store.load();
      validateState(state, endpoint);
      // Persist the host migration before any new API call; Git history retains the original.
      await store.save(state);
      await synchronize({ plan, state, save: (value) => store.save(value), create: (payload) => createVersion(endpoint, payload, headers), onResult: (row) => { results.push(row); console.log(`${row.status}: ${row.key}${row.id ? ` (id=${row.id})` : ''}${row.reason ? ` — ${row.reason}` : ''}`); } });
    }
  } catch (error) {
    fatalError = error;
  } finally {
    fs.writeFileSync(reportFile, `${JSON.stringify({ endpoint, apply: options.apply, ...(fatalError ? { error: fatalError.message } : {}), results }, null, 2)}\n`);
  }
  const counts = results.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }), {});
  console.log(JSON.stringify(counts));
  console.log(`报告：${path.relative(ROOT, reportFile)}`);
  if (env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `### PaperSkill 数据库同步\n\n${options.apply ? '执行' : '预览'}结果：\`${JSON.stringify(counts)}\`。完整问题清单及成功记录 ID 见 sync-report artifact。\n${fatalError ? '\n同步中断；此前成功创建的记录不会回滚，请查看报告核对未保存的 ID。\n' : ''}`);
  }
  if (fatalError) throw fatalError;
  if (options.apply && results.some((row) => ['blocked', 'uncertain', 'not_found'].includes(row.status))) process.exitCode = 1;
}

module.exports = { endpointFor, paperIdentifier, payloadFor, fingerprint, planFor, newState, validateState, createVersion, synchronize, localStore, githubStore, parseArgs, main };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
