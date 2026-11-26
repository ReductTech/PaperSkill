'use strict';

const { SHA } = require('./deployment-snapshot');

const LEDGER = 'paperskill-sync-state.json';
const JOURNAL = 'paperskill-delete-journal.json';

function deletionState({ repository, token, branch, fetchImpl = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !token ||
      !/^[a-zA-Z0-9_-]+$/.test(branch || '') || ['main', 'master'].includes(branch)) {
    throw new Error('删除状态只能写入已配置的独立同步分支');
  }
  const root = 'https://api.github.com/repos/' + repository;
  async function request(path, method, body) {
    return fetchImpl(root + path, {
      method, redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  async function read(file, optional = false) {
    const response = await request('/contents/' + file + '?ref=' + branch, 'GET');
    if (optional && response.status === 404) return null;
    if (!response.ok) throw new Error('读取删除状态失败，HTTP ' + response.status);
    const entry = await response.json();
    if (!SHA.test(entry.sha || '') || entry.encoding !== 'base64' || typeof entry.content !== 'string') {
      throw new Error('删除状态文件响应无效');
    }
    return { sha: entry.sha, state: JSON.parse(Buffer.from(entry.content, 'base64').toString('utf8')) };
  }

  async function write(file, sha, state, message) {
    // One compare-and-swap attempt. An uncertain write must not lead to a POST or retry.
    const response = await request('/contents/' + file, 'PUT', {
      branch, message, ...(sha ? { sha } : {}),
      content: Buffer.from(JSON.stringify(state, null, 2) + '\n').toString('base64'),
    });
    if (!response.ok) throw new Error('保存删除状态失败，需人工核对，HTTP ' + response.status);
    const result = await response.json();
    if (!SHA.test(result.content?.sha || '')) throw new Error('无法确认删除状态保存结果，需人工核对');
    return result.content.sha;
  }

  return {
    loadLedger: () => read(LEDGER),
    saveLedger: (sha, state) => write(LEDGER, sha, state, 'Record confirmed PaperSkill version deletion'),
    async claim(id, intent) {
      const file = await read(JOURNAL, true);
      const journal = file ? file.state : { schema_version: 1, endpoint: intent.endpoint, versions: {} };
      if (journal?.schema_version !== 1 || journal.endpoint !== intent.endpoint ||
          !journal.versions || typeof journal.versions !== 'object' || Array.isArray(journal.versions)) {
        throw new Error('删除操作日志与当前数据库环境不一致');
      }
      if (Object.hasOwn(journal.versions, id)) return false;
      journal.versions[id] = intent;
      await write(JOURNAL, file?.sha, journal, 'Reserve PaperSkill version deletion before sending');
      return true;
    },
  };
}

module.exports = { deletionState };