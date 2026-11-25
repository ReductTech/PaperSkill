'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { catalogRecord, versionRecord } = require('../lib/repository');
const { githubPublication } = require('../lib/github-publication');
const { createLifecycleClient } = require('../lib/paperskill-lifecycle');
const { planPublication } = require('../lib/publication-plan');
const { reconcile } = require('../reconcile-paperskill');
const { planFor, synchronize, newState } = require('../sync-paperskill');

const repository = 'Example/PaperSkill';
const endpoint = 'https://database.invalid/Web/V1/Paperskill/create_version';
const first = 'hello_world/alice1124';
const second = 'hello_world/bob1125';
const unrelated = 'other_paper/charlie1124';
const nonArxiv = 'different_source/dan1124';
const resolved = '1'.repeat(64);

function metadata(key, paperUrl = 'https://arxiv.org/abs/1706.03762') {
  const [paperName, version] = key.split('/');
  return { schemaVersion: 1, paperName, version, title: 'Test paper', paperUrl, skillVersion: '1.0.0',
    status: 'published', entry: 'index.html', versionDate: '2026-11-24',
    topics: ['test'], participants: [{ name: 'Tester', github: 'person' }] };
}

function call(root, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw Error(result.error?.message || result.stderr);
  return result.stdout.trim();
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperskill-publication-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => call(root, 'git', args);
  const file = (name, content) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), content);
  };
  const json = (name, value) => file(name, JSON.stringify(value));
  const data = new Map();
  function add(key, url) {
    const meta = metadata(key, url);
    data.set(key, meta);
    json('html_output/' + key + '/paper.json', meta);
    file('html_output/' + key + '/index.html', '<p>Tutorial source</p>');
    file('html_output/' + key + '/src/App.tsx', 'export default 1;');
  }
  function remove(key) {
    data.delete(key);
    fs.rmSync(path.join(root, 'html_output', key), { recursive: true });
  }
  function commit(message) {
    git('add', '--', 'html_output', 'catalog');
    git('commit', '-qm', message);
    return git('rev-parse', 'HEAD');
  }

  const versions = { [first]: { id: 101 }, [second]: { id: 102 }, [unrelated]: { id: 103 }, [nonArxiv]: { id: 104 } };
  const proof = Object.fromEntries(Object.entries(versions).map(([key, row]) =>
    [key, { id: row.id, page_path: 'papers/' + key + '/', reference: 'test-verified-id-' + row.id }]));
  const store = { schemaVersion: 1, endpoint, versions: Object.fromEntries(Object.entries(versions)
    .map(([key, row]) => [key, { id: row.id, status: 'synced', fingerprint: resolved }])) };
  const ownership = { schema_version: 1, repository, endpoint, versions: proof };
  json('catalog/paperskill-ownership.json', ownership);
  json('catalog/paperskill-overrides.json', {});
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(__dirname, '..', 'read-pages-artifact.py'), path.join(root, 'scripts', 'read-pages-artifact.py'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Publication tests');
  git('config', 'user.email', 'testing@example.invalid');
  git('config', 'core.hooksPath', path.join(root, 'no-hooks'));
  add(first);
  add(second);
  add(unrelated);
  add(nonArxiv, 'https://doi.org/10.1000/example');
  file('html_output/README.md', '# Versions');
  const initial = commit('Initial published versions');

  function artifact({ omit = '', wrongTitle = false, extra = false, link = false } = {}) {
    const site = fs.mkdtempSync(path.join(root, 'site-'));
    const papers = new Map();
    for (const [key, meta] of data) {
      const [paperName, version] = key.split('/');
      if (!papers.has(paperName)) papers.set(paperName, []);
      papers.get(paperName).push(versionRecord(meta, { paperName, version }));
      if (key !== omit) file(path.basename(site) + '/papers/' + key + '/index.html', '<p>Published ' + key + '</p>');
    }
    if (extra) file(path.basename(site) + '/papers/fake/alice1124/index.html', '<p>extra</p>');
    const catalog = [...papers].map(([paperName, rows]) => {
      const primary = [...rows].sort((a, b) => b.version.localeCompare(a.version))[0];
      return catalogRecord({ paperName }, rows, data.get(paperName + '/' + primary.version));
    });
    if (wrongTitle) catalog[0].title = 'Wrong title from a different build';
    json(path.basename(site) + '/papers.json', catalog);
    const tar = site + '.tar';
    const win = process.platform === 'win32';
    call(root, win ? 'py' : 'python3', [...(win ? ['-3'] : []), '-c', [
      'import tarfile, sys',
      'with tarfile.open(sys.argv[1], "w") as t:',
      '  t.add(sys.argv[2], arcname=".")',
      '  if sys.argv[3] == "true":',
      '    l = tarfile.TarInfo("../outside")',
      '    l.type = tarfile.SYMTYPE',
      '    l.linkname = "/private"',
      '    t.addfile(l)',
    ].join('\n'), tar, site, String(link)]);
    return tar;
  }

  return { root, git, file, json, data, add, remove, commit, artifact, initial, store, ownership };
}

function mockedGitHub(sha, state, failure) {
  const runId = '101';
  const attempt = '1';
  const artifactId = '401';
  const context = { sha, runId, attempt, artifactId };
  const ledgerSha = 'a'.repeat(40);
  let mainCalls = 0;
  let statusCalls = 0;
  let ledgerCalls = 0;
  const calls = [];
  const ref = sha => ({ object: { sha } });
  const responses = {
    '/actions/runs/101': { head_branch: 'main', head_sha: sha, path: '.github/workflows/deploy-pages.yml',
      run_attempt: 1, event: 'push', conclusion: failure === 'cancelled' ? 'cancelled' : null },
    '/actions/runs/101/attempts/1/jobs?per_page=100': { jobs: [
      { id: 201, run_attempt: 1, name: 'deploy', conclusion: ['failure', 'skipped'].includes(failure) ? failure : 'success' },
    ] },
    '/deployments?environment=github-pages&per_page=1': [{ id: 901, environment: 'github-pages', sha, ref: 'main' }],
    '/actions/artifacts/401': { id: 401, name: 'github-pages', expired: false,
      workflow_run: { id: 101, head_sha: failure === 'wrong-artifact' ? 'b'.repeat(40) : sha } },
    ['/contents/paperskill-sync-state.json?ref=' + ledgerSha]: state,
  };
  const fetchImpl = async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(new URL(url).origin, 'https://api.github.com');
    const route = url.split(repository)[1];
    calls.push(route);
    let body = responses[route];
    if (route === '/git/ref/heads/main') {
      mainCalls++;
      body = { ref: 'refs/heads/main', ...ref(failure === 'old' || (failure === 'race' && mainCalls > 1) ? 'b'.repeat(40) : sha) };
    }
    if (route === '/git/ref/heads/paperskill-sync-state') {
      ledgerCalls++;
      if (failure === 'no-ledger') return new Response('{}', { status: 404 });
      body = { ref: 'refs/heads/paperskill-sync-state', ...ref(failure === 'ledger-race' && ledgerCalls > 1 ? 'b'.repeat(40) : ledgerSha) };
    }
    if (route === '/deployments/901/statuses?per_page=1') {
      statusCalls++;
      body = [{ id: failure === 'status-race' && statusCalls > 1 ? 1002 : 1001, state: 'success',
        log_url: 'https://github.com/' + repository + '/actions/runs/101/job/' +
          (failure === 'old-deploy-at-same-sha' ? '200' : '201') }];
    }
    if (failure === 'network') throw new Error('simulated network failure');
    assert.ok(body, route);
    return new Response(JSON.stringify(body));
  };
  return { context, calls, github: githubPublication({
    repository, token: 'local-fixture', branch: 'paperskill-sync-state', fetchImpl,
  }) };
}

async function preview(f, sha, { failure, artifact, ledger = f.store } = {}) {
  const mock = mockedGitHub(sha, ledger, failure);
  const result = await reconcile({ root: f.root, archive: artifact || f.artifact(),
    repository, context: mock.context, endpoint, github: mock.github });
  assert.equal(result.report.apply_allowed, false);
  assert.ok(mock.calls.includes('/git/ref/heads/paperskill-sync-state'));
  return result;
}

test('full deployed manifest contains all versions, including non-arXiv, and initial/added versions sync once', async t => {
  const f = fixture(t);
  const result = await preview(f, f.initial);
  assert.deepEqual(new Set(result.manifest.versions.map(v => v.page_path)),
    new Set([first, second, unrelated, nonArxiv].map(key => 'papers/' + key + '/')));
  assert.equal(result.manifest.versions.length, 4);
  assert.equal(result.report.withdraw.length, 0);
  const state = newState(endpoint);
  const calls = [];
  const sync = keys => synchronize({
    plan: planFor(keys.map(key => {
      const [paperName, version] = key.split('/');
      return { paperName, version };
    }), {}, false, ({ paperName, version }) => f.data.get(paperName + '/' + version)),
    state, save: () => {}, create: payload => { calls.push(payload.page_path); return calls.length; },
  });
  assert.deepEqual((await sync([first])).map(row => row.status), ['created']);
  assert.deepEqual((await sync([first, second])).map(row => row.status), ['unchanged', 'created']);
  assert.deepEqual((await sync([first, second])).map(row => row.status), ['unchanged', 'unchanged']);
  assert.deepEqual(calls, [first, second].map(key => 'papers/' + key + '/'));
});

test('complete deletion reports one exact ID, keeps siblings, and can look past newer commits', async t => {
  const f = fixture(t);
  f.remove(first);
  const deletion = f.commit('A routine update without any magic commit word');
  f.file('html_output/README.md', '# New install instructions');
  const current = f.commit('Later unrelated deployment');
  const { report } = await preview(f, current);
  assert.equal(report.withdraw.length, 1);
  const candidate = report.withdraw[0];
  assert.deepEqual(candidate.remaining_versions, ['bob1125']);
  assert.equal(candidate.remote_id, 101);
  assert.equal(candidate.page_path, 'papers/' + first + '/');
  assert.equal(candidate.evidence.previous_commit, f.initial);
  assert.equal(candidate.evidence.deletion_commit, deletion);
  assert.deepEqual(candidate.evidence.removed_paths, [
    'html_output/' + first + '/index.html', 'html_output/' + first + '/paper.json',
    'html_output/' + first + '/src/App.tsx',
  ]);

  const retry = await preview(f, current);
  assert.equal(retry.report.withdraw[0].operation_key, candidate.operation_key);
  if (process.env.PAPERSKILL_TEST_REPORT) fs.writeFileSync(process.env.PAPERSKILL_TEST_REPORT, JSON.stringify(report, null, 2) + '\n');
});

test('whole-version and last-version removal in successive merges never creates a paper-level action', async t => {
  const f = fixture(t);
  f.git('switch', '-qc', 'contribution');
  f.remove(first);
  const fork = f.commit('Prune one old tutorial');
  f.git('switch', '-q', 'main');
  f.file('html_output/README.md', 'Parallel change');
  f.commit('Advance main before the PR merges');
  f.git('merge', '--no-ff', '-qm', 'Merge repository changes', fork);
  const merge = f.git('rev-parse', 'HEAD');
  f.remove(second);
  const next = f.commit('Delete the remaining tutorial');
  const { report } = await preview(f, next);
  assert.deepEqual(report.withdraw.map(row => row.remote_id), [101, 102]);
  assert.ok(report.withdraw.every(row => row.remaining_versions.length === 0));
  assert.equal(report.withdraw[0].evidence.deletion_commit, merge);
  assert.equal(report.withdraw[1].evidence.deletion_commit, next);
});

test('Revert of malformed root files like #519/#535 preserves both existing valid versions', async t => {
  const f = fixture(t);
  f.file('html_output/hello_world/index.html', 'bad landing page');
  f.file('html_output/hello_world/assets/index.js', 'bad asset');
  f.file('html_output/hello_world/images/figure.png', 'bad image');
  const bad = f.commit('Add malformed root artifacts');
  await assert.rejects(preview(f, bad), /网页路径异常/);
  f.git('revert', '--no-edit', bad);
  const fixed = f.git('rev-parse', 'HEAD');
  assert.equal((await preview(f, fixed)).report.withdraw.length, 0);
});

test('removing metadata or an entry point, corrupting metadata, and an empty tree halt planning', async t => {
  const f = fixture(t);
  const meta = path.join(f.root, 'html_output', first, 'paper.json');
  fs.unlinkSync(meta);
  await assert.rejects(preview(f, f.commit('Remove only metadata')), /缺少 paper.json/);
  f.file('html_output/' + first + '/paper.json', '{');
  await assert.rejects(preview(f, f.commit('Malformed metadata')), /JSON|position|property/i);
  f.json('html_output/' + first + '/paper.json', metadata(first));
  fs.unlinkSync(path.join(f.root, 'html_output', first, 'index.html'));
  await assert.rejects(preview(f, f.commit('Remove only entry')), /缺少 paper.json 或 index.html/);
  for (const key of [...f.data.keys()]) f.remove(key);
  await assert.rejects(preview(f, f.commit('Remove every version'), { artifact: 'unused.tar' }), /清单为空/);
});

test('disposing of one ordinary source asset or changing arXiv eligibility keeps deployed versions active', async t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, 'html_output', first, 'src/App.tsx'));
  const newMeta = metadata(first, 'https://doi.org/10.1000/example');
  f.data.set(first, newMeta);
  f.json('html_output/' + first + '/paper.json', newMeta);
  const { report } = await preview(f, f.commit('Adjust page and metadata'));
  assert.equal(report.withdraw.length, 0);

  f.remove(nonArxiv);
  const removed = await preview(f, f.commit('Delete a non-arXiv tutorial'));
  assert.equal(removed.report.withdraw.length, 0);
  assert.equal(removed.report.blocked[0].reason, 'no_confirmed_arxiv_id');
});

test('wrong, empty, incomplete, duplicate-like or unsafe Pages artifacts fail closed', async t => {
  const f = fixture(t);
  for (const [options, error] of [
    [{ omit: first }, /网页入口不一致/],
    [{ wrongTitle: true }, /论文元数据不一致/],
    [{ extra: true }, /清单不完整/],
    [{ link: true }, /Invalid Pages artifact entry/],
  ]) await assert.rejects(preview(f, f.initial, { artifact: f.artifact(options) }), error);
  const truncated = f.artifact();
  fs.truncateSync(truncated, fs.statSync(truncated).size - 10240);
  await assert.rejects(preview(f, f.initial, { artifact: truncated }), /不能验证/);
});

test('a withdrawn version becomes a restore candidate when published again using the same ID', async t => {
  const f = fixture(t);
  f.remove(first);
  const removal = f.commit('Remove site version');
  f.store.versions[first].publication = { status: 'withdrawn', source_sha: removal };
  assert.equal((await preview(f, removal)).report.withdraw.length, 0);
  f.git('revert', '--no-edit', removal);
  f.data.set(first, metadata(first));
  const sha = f.git('rev-parse', 'HEAD');
  const { report } = await preview(f, sha);
  assert.equal(report.restore.length, 1);
  assert.equal(report.restore[0].remote_id, 101);
  assert.equal(report.restore[0].evidence.withdrawn_at_commit, removal);
  assert.equal(report.restore[0].evidence.restored_at_commit, sha);
  f.store.versions[first].publication.source_sha = f.initial;
  const stale = await preview(f, sha);
  assert.equal(stale.report.restore.length, 0);
  assert.equal(stale.report.blocked[0].reason, 'restoration_history_unproven');
});

test('failed, skipped, canceled, superseded and changing deployments cannot yield a plan', async t => {
  const f = fixture(t);
  f.remove(first);
  const sha = f.commit('Delete one version');
  for (const failure of ['failure', 'skipped', 'cancelled', 'old', 'old-deploy-at-same-sha',
    'race', 'wrong-artifact', 'status-race', 'ledger-race', 'network', 'no-ledger']) {
    await assert.rejects(preview(f, sha, { failure }), undefined, failure);
  }
});

test('unknown ownership, duplicate IDs, bad state, and an unproven removal fail safely', async t => {
  const f = fixture(t);
  f.remove(first);
  delete f.ownership.versions[first];
  f.json('catalog/paperskill-ownership.json', f.ownership);
  const sha = f.commit('Delete unconfirmed record');
  const r = await preview(f, sha);
  assert.equal(r.report.blocked[0].reason, 'ownership_unconfirmed');
  assert.equal(r.report.blocked[0].remote_id, 101);
  assert.equal(r.report.blocked[0].ownership_confirmed, false);
  const duplicate = structuredClone(f.store);
  duplicate.versions[second].id = 101;
  assert.equal((await preview(f, sha, { ledger: duplicate })).report.blocked[0].reason, 'unverified_or_duplicate_ledger_id');
  await assert.rejects(preview(f, sha, { ledger: { ...f.store, endpoint: 'https://other.invalid' } }), /环境不一致/);

  const unknownKey = 'missing_entry/elaine1124';
  f.store.versions[unknownKey] = { status: 'synced', id: 405, fingerprint: resolved };
  assert.ok((await preview(f, sha)).report.blocked.some(row => row.reason === 'whole_directory_deletion_unproven'));
});

test('a large deletion plan is stopped even with confirmations', () => {
  const many = Object.fromEntries(Array.from({ length: 12 }, (_, i) =>
    ['paper' + i + '/alice1124', { status: 'synced', id: i + 1, fingerprint: resolved }]));
  const proof = Object.fromEntries(Object.entries(many).map(([key, row]) =>
    [key, { id: row.id, page_path: 'papers/' + key + '/', reference: 'confirmed' }]));
  const report = planPublication({ repository, sourceSha: '3'.repeat(40), endpoint,
    deployment: { deployment_id: 901 }, evidenceFor: () => assert.fail('bulk guard must run before Git history scans'),
    snapshot: { versions: new Map([[first, metadata(first)]]), overrides: {},
      ownership: { schema_version: 1, repository, endpoint, versions: proof } },
    ledger: { schemaVersion: 1, endpoint, versions: many },
  });
  assert.equal(report.stop_reason, 'unexpected_withdrawal_volume');
  assert.equal(report.withdraw.length, 0);
  assert.equal(report.blocked.length, 12);
});

test('future lifecycle adapter is disabled by default and stops on backend failure or wrong ownership', async () => {
  const identity = { repository, endpoint, version_key: first, id: 101, page_path: 'papers/' + first + '/' };
  const context = { source_sha: '3'.repeat(40), deployment_id: 901, operation_key: resolved };
  let writes = 0;
  let status = 'active';
  const transport = {
    lookup: async () => ({ ...identity, publication_status: status }),
    withdraw: async (_, options) => {
      assert.equal(options.expected_status, 'active');
      assert.equal(options.operation_key, context.operation_key);
      writes++;
      status = 'withdrawn';
      return { ...identity, publication_status: status, changed: true };
    },
    restore: async (_, options) => {
      assert.equal(options.expected_status, 'withdrawn');
      writes++;
      status = 'active';
      return { ...identity, publication_status: status, changed: true };
    },
  };
  await assert.rejects(createLifecycleClient(transport).withdraw(identity, context), /写入已禁用/);
  const client = createLifecycleClient(transport, { enabled: true });
  assert.equal((await client.withdraw(identity, context)).changed, true);
  assert.equal((await client.withdraw(identity, context)).changed, false);
  assert.equal((await client.restore(identity, context)).changed, true);
  assert.equal(writes, 2);
  transport.lookup = async () => ({ ...identity, repository: 'Different/repo', publication_status: 'active' });
  await assert.rejects(client.withdraw(identity, context), /归属/);
  transport.lookup = async () => { throw new Error('unavailable'); };
  await assert.rejects(client.withdraw(identity, context), /unavailable/);
  assert.equal(writes, 2);
  transport.lookup = async () => ({ ...identity, publication_status: 'active' });
  transport.withdraw = async () => { throw new Error('timeout after submission'); };
  await assert.rejects(client.withdraw(identity, context), /timeout after submission/);
});
