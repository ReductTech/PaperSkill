'use strict';

const { createHash } = require('node:crypto');
const { validKey, SHA } = require('./deployment-snapshot');
const { paperIdentifier } = require('../../../../scripts/sync-paperskill');

const DIGEST = /^[0-9a-f]{64}$/;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const versionId = id => Number.isSafeInteger(id) && id > 0;

function validateOwnership(ownership, repository, endpoint) {
  if (ownership === null) return {};
  if (!record(ownership) || ownership.schema_version !== 1 || ownership.repository !== repository ||
      ownership.endpoint !== endpoint || !record(ownership.versions)) {
    throw new Error('归属确认文件与当前仓库、数据库环境或 schema 不一致');
  }
  return ownership.versions;
}

function planPublication({ repository, sourceSha, deployment, snapshot, ledger, endpoint, evidenceFor, restoredAt }) {
  if (!deployment || !versionId(deployment.deployment_id) || !SHA.test(sourceSha) || !snapshot.versions.size ||
      !record(snapshot.overrides) || !record(ledger) || ledger.schemaVersion !== 1 ||
      ledger.endpoint !== endpoint || !record(ledger.versions) || !Object.keys(ledger.versions).length) {
    throw new Error('部署或同步账本缺失、为空或与数据库环境不一致');
  }

  const ownership = validateOwnership(snapshot.ownership, repository, endpoint);
  const byPaper = new Map();
  for (const key of snapshot.versions.keys()) {
    const [paper, version] = key.split('/');
    if (!byPaper.has(paper)) byPaper.set(paper, []);
    byPaper.get(paper).push(version);
  }

  const idCounts = new Map();
  for (const row of Object.values(ledger.versions)) {
    if (versionId(row?.id)) idCounts.set(row.id, (idCounts.get(row.id) || 0) + 1);
  }
  const report = { ...deployment, dry_run: true, apply_allowed: false, repository, source_sha: sourceSha,
    withdraw: [], restore: [], blocked: [], stop_reason: null };
  const synced = Object.entries(ledger.versions).filter(([, row]) => row?.status === 'synced');
  const absent = synced.filter(([key, row]) =>
    !snapshot.versions.has(key) && row.publication?.status !== 'withdrawn').length;
  if (absent > 10 || (synced.length >= 10 && absent / synced.length > 0.2)) {
    report.stop_reason = 'unexpected_withdrawal_volume';
  }

  for (const [key, row] of Object.entries(ledger.versions).sort(([a], [b]) => a.localeCompare(b))) {
    const present = snapshot.versions.has(key);
    const withdrawn = row?.publication?.status === 'withdrawn';
    if (present && !withdrawn) continue;
    if (!present && withdrawn) continue;
    const [paperName, versionName] = key.split('/');
    const pagePath = 'papers/' + key + '/';
    const proof = Object.hasOwn(ownership, key) ? ownership[key] : undefined;
    const confirmed = validKey(key) && versionId(row?.id) && idCounts.get(row.id) === 1 &&
      record(proof) && proof.id === row.id && proof.page_path === pagePath &&
      typeof proof.reference === 'string' && Boolean(proof.reference.trim());
    const item = { paper_name: paperName, version_name: versionName ?? null,
      remote_id: versionId(row?.id) ? row.id : null, page_path: pagePath,
      remaining_versions: (byPaper.get(paperName) || []).filter(version => version !== versionName).sort(),
      ownership_confirmed: Boolean(confirmed), ownership_reference: confirmed ? proof.reference : null,
      evidence: null };
    const block = (reason, detail) => report.blocked.push({ ...item, reason, ...(detail ? { detail } : {}) });
    if (!validKey(key) || row?.status !== 'synced' || !versionId(row.id) || !DIGEST.test(row.fingerprint || '') ||
        idCounts.get(row.id) !== 1) {
      block('unverified_or_duplicate_ledger_id');
      continue;
    }
    if (row.publication && !['active', 'withdrawn'].includes(row.publication.status)) {
      block('unknown_publication_state');
      continue;
    }

    if (report.stop_reason) {
      block(report.stop_reason);
      continue;
    }

    let context;
    try {
      if (present) {
        if (!SHA.test(row.publication.source_sha || '')) {
          block('withdrawal_receipt_missing');
          continue;
        }
        context = { meta: snapshot.versions.get(key), override: snapshot.overrides[key] || {} };
        item.evidence = restoredAt(key, row.publication.source_sha);
        if (!item.evidence) {
          block('restoration_history_unproven');
          continue;
        }
      } else {
        context = evidenceFor(key);
        if (!context) {
          block('whole_directory_deletion_unproven', '请人工核对该版本在 main 上的完整删除历史。若先删除 paper.json 再删除其他文件，需核对两次提交及远端版本归属。');
          continue;
        }
        item.evidence = context.evidence;
      }
      const override = context.override;
      if (!record(override)) throw new Error('版本标识覆盖格式无效');
      const identifier = override.doi ? null : (Object.hasOwn(override, 'arxiv_id')
        ? override.arxiv_id : paperIdentifier(context.meta.paperUrl).arxiv_id);
      if (typeof identifier !== 'string' || !/^(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z]{2})?\/\d{7})$/i.test(identifier)) {
        block('no_confirmed_arxiv_id');
        continue;
      }
    } catch (error) {
      // History/parse/network faults halt the entire plan rather than allow
      // other removals to look authoritative against a suspect snapshot.
      throw new Error(key + ' 无法完成 Git 或元数据核对：' + error.message);
    }
    if (!confirmed) {
      block('ownership_unconfirmed');
      continue;
    }
    const action = present ? 'restore' : 'withdraw';
    const operationKey = createHash('sha256').update(JSON.stringify([repository, endpoint,
      deployment.deployment_id, sourceSha, action, key, row.id])).digest('hex');
    report[action].push({ ...item, operation_key: operationKey,
      reason: present ? 'withdrawn_version_published_again' : 'whole_version_directory_removed_and_page_absent' });
  }
  return report;
}

module.exports = { planPublication };
