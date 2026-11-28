'use strict';

const { createWriteStream } = require('node:fs');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { SHA } = require('./deployment-snapshot');

function githubPublication({ repository, token, branch, fetchImpl = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !token ||
      !/^[a-zA-Z0-9_-]+$/.test(branch || '') || ['main', 'master'].includes(branch)) {
    throw new Error('缺少 GitHub 只读上下文或账本分支无效');
  }
  const root = 'https://api.github.com/repos/' + repository;
  function request(route, accept = 'application/vnd.github+json', redirect = 'error') {
    return fetchImpl(root + route, {
      method: 'GET', redirect, signal: AbortSignal.timeout(30000),
      headers: { Accept: accept, Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' },
    });
  }

  async function get(route, accept) {
    const response = await request(route, accept);
    if (!response.ok) throw new Error('GitHub 只读查询失败，HTTP ' + response.status + ' (' + route.split('?')[0] + ')');
    return response.json();
  }

  async function ref(name) {
    const value = await get('/git/ref/heads/' + name);
    if (value.ref !== 'refs/heads/' + name || !SHA.test(value.object?.sha || '')) throw new Error('GitHub 分支引用无效');
    return value.object.sha;
  }

  async function checkDeployment({ sha, runId, attempt, artifactId }) {
    if (!SHA.test(sha || '') || ![runId, attempt, artifactId].every(value => /^\d+$/.test(value || ''))) {
      throw new Error('缺少部署 SHA、工作流运行 ID、尝试编号或 Pages 制品 ID');
    }
    const runPath = '/actions/runs/' + runId;
    const [main, run, jobs, deployments, artifact] = await Promise.all([
      ref('main'),
      get(runPath),
      get(runPath + '/attempts/' + attempt + '/jobs?per_page=100'),
      get('/deployments?environment=github-pages&per_page=1'),
      get('/actions/artifacts/' + artifactId),
    ]);
    if (main !== sha || run.head_branch !== 'main' || run.head_sha !== sha ||
        run.path !== '.github/workflows/deploy-pages.yml' || String(run.run_attempt) !== attempt ||
        !['push', 'workflow_dispatch'].includes(run.event) ||
        (run.conclusion && run.conclusion !== 'success')) {
      throw new Error('当前运行无法证明是 main 最新提交的 Pages 部署');
    }
    const deployJobs = jobs.jobs.filter(job => job.name === 'deploy');
    const job = deployJobs[0];
    const deployment = deployments[0];
    if (deployJobs.length !== 1 || job.conclusion !== 'success' || String(job.run_attempt) !== attempt ||
        !deployment || deployment.environment !== 'github-pages' || deployment.sha !== sha ||
        !['main', 'refs/heads/main'].includes(deployment.ref) ||
        !Number.isSafeInteger(deployment.id)) {
      throw new Error('缺少本次尝试的最近 Pages 部署成功证据');
    }
    if (String(artifact.id) !== artifactId || artifact.name !== 'github-pages' || artifact.expired !== false ||
        String(artifact.workflow_run?.id) !== runId || artifact.workflow_run?.head_sha !== sha) {
      throw new Error('Pages 制品归属与当前部署不一致');
    }
    if (typeof artifact.digest !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(artifact.digest) || artifact.digest.length !== 71) {
      throw new Error('GitHub 未提供有效的 Pages 制品 ZIP SHA-256 摘要');
    }
    const statuses = await get('/deployments/' + deployment.id + '/statuses?per_page=1');
    const status = statuses[0];
    const jobUrl = 'https://github.com/' + repository + '/actions/runs/' + runId + '/job/' + job.id;
    if (status?.state !== 'success' || status.log_url !== jobUrl || !Number.isSafeInteger(status.id)) {
      throw new Error('Pages 最新部署状态不属于本次成功的 deploy job');
    }
    return { deployment_id: deployment.id, deployment_status_id: status.id, deploy_job_id: job.id,
      artifact_zip_sha256: artifact.digest.slice(7) };
  }

  async function downloadArtifact(artifactId, destination) {
    if (!/^\d+$/.test(artifactId || '')) throw new Error('Pages 制品 ID 无效');
    const redirect = await request('/actions/artifacts/' + artifactId + '/zip', undefined, 'manual');
    if (redirect.status !== 302 || !redirect.headers.get('location')) {
      throw new Error('GitHub 制品 ZIP 下载入口查询失败，HTTP ' + redirect.status);
    }
    // GitHub issues a short-lived signed URL. Keep the GitHub token on the API host.
    try {
      const url = new URL(redirect.headers.get('location'));
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid download URL');
      const response = await fetchImpl(url, { method: 'GET', redirect: 'error',
        signal: AbortSignal.timeout(15 * 60 * 1000) });
      if (response.status !== 200 || !response.body) throw new Error('Missing ZIP body');
      await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: 'wx' }));
    } catch {
      throw new Error('无法完整下载 GitHub Pages 制品 ZIP');
    }
  }

  async function loadLedger() {
    const revision = await ref(branch);
    const state = await get('/contents/paperskill-sync-state.json?ref=' + revision,
      'application/vnd.github.raw+json');
    return { revision, state };
  }

  return { checkDeployment, downloadArtifact, loadLedger, ledgerRevision: () => ref(branch) };
}

module.exports = { githubPublication };
