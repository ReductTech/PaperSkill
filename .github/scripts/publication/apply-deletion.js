#!/usr/bin/env node
'use strict';

const { isDeepStrictEqual } = require('node:util');
const { ROOT } = require('../../../scripts/lib/repository');
const { endpointFor } = require('../../../scripts/sync-paperskill');
const { githubPublication } = require('./lib/github-publication');
const { deletionState } = require('./lib/deletion-state');
const { createDeleteVersion, CREATE_ENDPOINT } = require('./lib/delete-version');
const { reconcile } = require('./reconcile-paperskill');

async function applyDeletion({ enabled, root, repository, context, endpoint, github, state, deleteVersion }) {
  if (enabled !== true) throw new Error('PaperSkill 版本删除未启用');
  if (endpoint !== CREATE_ENDPOINT) throw new Error('删除接口与入库账本的数据库环境不一致');

  // Create the plan here rather than accepting a previously exported preview.
  const { report } = await reconcile({ root, repository, context, endpoint, github });
  for (const row of report.restore) console.log('网页已重新发布，需人工核对：' + row.page_path);
  if (report.stop_reason) throw new Error('撤回核对已停止：' + report.stop_reason);
  if (!report.withdraw.length) return [];

  const ledger = await github.loadLedger();
  if (ledger.revision !== report.ledger_sha) throw new Error('核对后账本已变化');
  let expected = ledger.state;
  const deleted = [];

  for (const row of report.withdraw) {
    const key = row.paper_name + '/' + row.version_name;
    const current = await state.loadLedger();
    if (!isDeepStrictEqual(current.state, expected)) throw new Error('核对后账本已变化');
    const id = current.state.versions[key].id;
    if (id !== row.remote_id) throw new Error('撤回候选与入库账本 ID 不一致');
    const receipt = { endpoint, repository, version_key: key, id, page_path: row.page_path,
      source_sha: report.source_sha, deployment_id: report.deployment_id, operation_key: row.operation_key };

    const claimed = await state.claim(id, { ...receipt, started_at: new Date().toISOString() });
    if (!claimed) {
      console.log('已有删除操作记录，需人工核对：' + row.page_path);
      continue;
    }
    const before = await state.loadLedger();
    if (before.sha !== current.sha || !isDeepStrictEqual(before.state, expected)) {
      throw new Error('删除前账本已变化，需人工核对操作日志');
    }
    const latest = await github.checkDeployment(context);
    for (const field of ['deployment_id', 'deployment_status_id', 'deploy_job_id', 'artifact_zip_sha256']) {
      if (report[field] !== latest[field]) throw new Error('删除前部署已变化，需人工核对操作日志');
    }
    await deleteVersion(id);

    const next = structuredClone(expected);
    next.versions[key].publication = { ...next.versions[key].publication, ...receipt,
      status: 'withdrawn', deleted_at: new Date().toISOString() };
    await state.saveLedger(before.sha, next);
    expected = next;
    deleted.push({ key, id });
  }
  return deleted;
}

async function main(env) {
  if (env.PAPERSKILL_DELETE_ENABLED !== 'true' || env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('PaperSkill 版本删除须在 main 部署完成并显式启用后运行');
  }
  const deleteVersion = createDeleteVersion({ enabled: true,
    contract: JSON.parse(env.PAPERSKILL_DELETE_CONTRACT || 'null'),
    createHeaders: env.PAPERSKILL_API_HEADERS, deleteHeaders: env.PAPERSKILL_DELETE_HEADERS });
  const repository = env.GITHUB_REPOSITORY;
  const storage = { repository, token: env.GITHUB_TOKEN,
    branch: env.PAPERSKILL_STATE_BRANCH || 'paperskill-sync-state' };
  const deleted = await applyDeletion({ root: ROOT, repository, enabled: true,
    context: { sha: env.GITHUB_SHA, runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT,
      artifactId: env.PAGES_ARTIFACT_ID },
    endpoint: endpointFor(env.PAPERSKILL_API_BASE_URL || 'https://app.reduct.cn'),
    github: githubPublication(storage), state: deletionState(storage), deleteVersion });
  console.log(JSON.stringify({ deleted }));
}

if (require.main === module) {
  main(process.env).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { applyDeletion };