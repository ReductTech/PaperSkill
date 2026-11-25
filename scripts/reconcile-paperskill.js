#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./lib/repository');
const { endpointFor } = require('./sync-paperskill');
const { loadSnapshot, verifyArtifact, removalEvidence, restorationEvidence } = require('./lib/deployment-snapshot');
const { githubPublication } = require('./lib/github-publication');
const { planPublication } = require('./lib/publication-plan');

async function reconcile({ root, archive, repository, context, endpoint, github }) {
  const deployment = await github.checkDeployment(context);
  const snapshot = loadSnapshot(root, context.sha);
  const verified = verifyArtifact(root, archive, snapshot);
  const ledger = await github.loadLedger();
  const provenance = {
    ...deployment, run_id: context.runId, run_attempt: context.attempt,
    artifact_id: context.artifactId, artifact_sha256: verified.artifact_sha256,
  };
  const report = planPublication({
    repository, sourceSha: context.sha, deployment: provenance, snapshot, ledger: ledger.state, endpoint,
    evidenceFor: key => removalEvidence(root, context.sha, key),
    restoredAt: (key, withdrawnAt) => restorationEvidence(root, context.sha, key, withdrawnAt),
  });
  if (report.withdraw.some(row => row.evidence.removed_paths.length === 0)) {
    throw new Error('撤回缺少版本目录删除证据');
  }

  // Evidence may become stale while a large artifact is being read.
  const [latestDeployment, ledgerRevision] = await Promise.all([
    github.checkDeployment(context), github.ledgerRevision(),
  ]);
  if (latestDeployment.deployment_id !== deployment.deployment_id ||
      latestDeployment.deployment_status_id !== deployment.deployment_status_id ||
      latestDeployment.deploy_job_id !== deployment.deploy_job_id || ledgerRevision !== ledger.revision) {
    throw new Error('部署状态或账本在核对期间更新，须重新运行预演');
  }

  return {
    manifest: { schema_version: 1, repository, source_sha: context.sha, ...provenance,
      versions: verified.versions },
    report: { ...report, ledger_sha: ledger.revision, published_versions: verified.versions.length },
  };
}

async function main(args, env) {
  if (args.length !== 2) {
    throw new Error('用法：node scripts/reconcile-paperskill.js <github-pages/artifact.tar> <输出目录>');
  }
  const [archive, directory] = args.map(file => path.resolve(file));
  fs.mkdirSync(directory, { recursive: true });
  const write = (file, value) => fs.writeFileSync(path.join(directory, file),
    JSON.stringify(value, null, 2) + '\n');
  const context = { sha: env.GITHUB_SHA, runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT,
    artifactId: env.PAGES_ARTIFACT_ID };
  try {
    if (env.GITHUB_REF !== 'refs/heads/main') throw new Error('撤回预演仅支持 main 的 Pages 成功部署');
    const github = githubPublication({ repository: env.GITHUB_REPOSITORY,
      token: env.GITHUB_TOKEN, branch: env.PAPERSKILL_STATE_BRANCH || 'paperskill-sync-state' });
    const result = await reconcile({
      root: ROOT, archive, repository: env.GITHUB_REPOSITORY, context,
      endpoint: endpointFor(env.PAPERSKILL_API_BASE_URL || 'https://app.reduct.cn'), github,
    });
    write('deployed-versions.json', result.manifest);
    write('reconciliation.json', result.report);
    console.log('撤回预演：' + JSON.stringify({
      withdraw: result.report.withdraw.length, restore: result.report.restore.length,
      blocked: result.report.blocked.length, stop_reason: result.report.stop_reason,
    }));
  } catch (error) {
    write('reconciliation.json', { dry_run: true, apply_allowed: false, repository: env.GITHUB_REPOSITORY,
      source_sha: context.sha, withdraw: [], restore: [], blocked: [],
      stop_reason: 'verification_failed', detail: error.message });
    throw error;
  }
}

if (require.main === module) {
  main(process.argv.slice(2), process.env).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { reconcile };
