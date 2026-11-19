'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { test } = require('node:test');
const {
  endpointFor, paperIdentifier, payloadFor, planFor, newState, validateState,
  createVersion, synchronize, githubStore,
} = require('../sync-paperskill');

const endpoint = endpointFor('https://example.com');
const legacyEndpoint = endpointFor('https://php-testbed-lyx.reduct.cn');
const productionEndpoint = endpointFor('https://app.reduct.cn');
const submission = { paperName: 'test_paper', version: 'alice1027' };
function metadata(extra = {}) {
  return {
    paperName: 'test_paper', version: 'alice1027', versionDate: '2026-10-27',
    paperUrl: 'https://arxiv.org/pdf/1706.03762v7.pdf',
    participants: [{ name: 'Alice 中文', github: '@alice', jianlunId: '000AbC' }],
    topics: ['cv', 'nlp'], ...extra,
  };
}

test('copied production database preserves IDs, fingerprints and uncertain attempts without duplicate creates', async () => {
  const plan = planFor([submission], {}, false, () => metadata());
  for (const status of ['synced', 'pending', 'uncertain', 'not_found']) {
    const state = newState(legacyEndpoint);
    state.versions[plan[0].key] = { status, id: 42, fingerprint: plan[0].fingerprint };
    const originalVersions = structuredClone(state.versions);
    validateState(state, productionEndpoint);
    assert.equal(state.endpoint, productionEndpoint);
    assert.deepEqual(state.versions, originalVersions);
    let saves = 0;
    const results = await synchronize({ plan, state, save: async () => { saves++; },
      create: async () => assert.fail('Historical versions must not be recreated') });
    assert.ok(saves > 0);
    assert.equal(results[0].status, status === 'synced' ? 'unchanged' : status === 'not_found' ? 'skipped' : 'blocked');
    const migrated = structuredClone(state);
    validateState(state, productionEndpoint);
    assert.deepEqual(state, migrated);
  }
});

test('domain migration is one-way and limited to the confirmed database copy', () => {
  assert.throws(() => validateState(newState(productionEndpoint), legacyEndpoint), /不一致/);
  assert.throws(() => validateState(newState(endpoint), productionEndpoint), /不一致/);
  assert.throws(() => validateState(newState(legacyEndpoint), endpoint), /不一致/);
});

test('new versions after the host migration use production and preserve existing IDs', async () => {
  const plan = planFor([submission], {}, false, () => metadata());
  const state = newState(legacyEndpoint);
  state.versions['other/existing'] = { status: 'synced', id: 19, fingerprint: 'unchanged' };
  validateState(state, productionEndpoint);
  let requests = 0;
  await synchronize({ plan, state, save: async () => {}, create: async payload =>
    createVersion(state.endpoint, payload, {}, async (url, options) => {
      requests++;
      assert.equal(url, productionEndpoint);
      assert.equal(options.body.get('page_path'), plan[0].payload.page_path);
      return Response.json({ code: 200, data: { id: 43 } });
    }) });
  assert.equal(requests, 1);
  assert.equal(state.versions['other/existing'].id, 19);
  assert.equal(state.versions[plan[0].key].id, 43);
});

test('metadata converts to the documented multipart fields without guessing UUID or sending two paper identifiers', () => {
  const payload = payloadFor(submission, metadata({ ancestors: [{ github: '@original', version: 'original1016' }] }));
  assert.deepEqual(payload, {
    version_name: 'alice1027', version_date: '2026-10-27', user_display_name: 'Alice 中文',
    user_github_name: 'alice', page_path: 'papers/test_paper/alice1027/', arxiv_id: '1706.03762',
    ancestors: '[{"user_github_name":"original","version_name":"original1016"}]', tags: 'cv,nlp',
  });
  assert.equal(payloadFor(submission, metadata(), {}, true).uuid, '000AbC');
  assert.equal(payloadFor(submission, metadata(), { uuid: 'explicit-uuid' }).uuid, 'explicit-uuid');
  assert.deepEqual(paperIdentifier('https://arxiv.org/abs/hep-th/9901001v2'), { arxiv_id: 'hep-th/9901001' });
  assert.deepEqual(paperIdentifier('https://doi.org/10.1000/example'), { doi: '10.1000/example' });
  assert.deepEqual(paperIdentifier('https://not-arxiv.org/abs/1706.03762'), {});
  assert.throws(() => payloadFor(submission, metadata(), { doi: '10.1000/example' }), error => error.skip === 'missing_arxiv_id');
});

test('invalid metadata is blocked before any upload; manual identifiers support non-arxiv source URLs', () => {
  assert.throws(() => payloadFor(submission, metadata({ participants: [{ name: 'Alice' }] })), /user_github_name/);
  assert.throws(() => payloadFor(submission, metadata({ versionDate: '2026-02-30' })), /真实/);
  assert.throws(() => payloadFor(submission, metadata(), { arxiv_id: '1706.03762', doi: '10.1000/x' }), /唯一/);
  assert.throws(() => payloadFor(submission, metadata({ ancestors: [{ version: 'source1016' }] })), /溯源/);
  assert.throws(() => payloadFor(submission, metadata(), { remote_id: -1 }), /remote_id/);
  assert.throws(() => endpointFor('http://example.com'), /HTTPS/);
  assert.throws(() => endpointFor('https://example.com/unexpected-path'), /根地址/);
  assert.equal(payloadFor(submission, metadata({ paperUrl: 'https://conference.example/paper.pdf' }), { arxiv_id: '1706.03762' }).arxiv_id, '1706.03762');
});

test('real HTTP request uses POST multipart boundaries, Unicode fields, and JSON-string ancestry', async (t) => {
  let captured;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captured = { method: req.method, headers: req.headers, body: Buffer.concat(chunks).toString('utf8') };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 200, msg: '入库成功', data: { id: 42 } }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const payload = payloadFor(submission, metadata({ ancestors: [{ github: 'original', version: 'original1016' }] }));
  assert.equal(await createVersion(`http://127.0.0.1:${server.address().port}/create_version`, payload), 42);
  assert.equal(captured.method, 'POST');
  assert.match(captured.headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.match(captured.body, /name="arxiv_id"\r\n\r\n1706\.03762/);
  assert.match(captured.body, /Alice 中文/);
  assert.ok(captured.body.includes(payload.ancestors));
  assert.ok(!captured.body.includes('name="uuid"'));
  assert.ok(!captured.body.includes('name="doi"'));
});

test('HTTP 200 with business failure or missing database ID never counts as success', async () => {
  for (const response of [{ code: 401, data: {} }, { code: 200, data: {} }, { code: 200, data: { id: '42' } }]) {
    await assert.rejects(createVersion(endpoint, {}, {}, async () => new Response(JSON.stringify(response))), /未确认/);
  }
});

test('ancestors upload first, successful IDs persist, repeated scans do not duplicate, changed metadata is not recreated', async () => {
  const child = { paperName: 'test_paper', version: 'bob1027' };
  const parent = { paperName: 'test_paper', version: 'alice1027' };
  const plan = planFor([child, parent], {}, false, (item) => metadata(item.version === 'bob1027'
    ? { version: 'bob1027', participants: [{ name: 'Bob', github: 'bob' }], ancestors: [{ github: 'alice', version: 'alice1027' }] }
    : {}));
  assert.deepEqual(plan.map((row) => row.key), ['test_paper/alice1027', 'test_paper/bob1027']);
  const state = newState(endpoint);
  const checkpoints = [];
  let calls = 0;
  const save = async (value) => checkpoints.push(structuredClone(value));
  const create = async (payload) => {
    assert.equal(checkpoints.at(-1).versions[`test_paper/${payload.version_name}`].status, 'pending');
    return ++calls;
  };
  assert.deepEqual((await synchronize({ plan, state, save, create })).map((row) => row.status), ['created', 'created']);
  assert.equal(checkpoints.at(-1).versions['test_paper/bob1027'].id, 2);
  assert.deepEqual((await synchronize({ plan, state, save, create })).map((row) => row.status), ['unchanged', 'unchanged']);
  const changed = [{ ...plan[0], fingerprint: 'changed' }];
  assert.equal((await synchronize({ plan: changed, state, save, create }))[0].status, 'blocked');
  assert.equal(calls, 2);
});

test('ambiguous failures and interrupted checkpoints require reconciliation instead of blind retry', async () => {
  const plan = planFor([submission], {}, false, () => metadata());
  const state = newState(endpoint);
  let calls = 0;
  const create = async () => { calls += 1; throw new Error('timeout after server commit'); };
  const save = async () => {};
  assert.equal((await synchronize({ plan, state, save, create }))[0].status, 'uncertain');
  assert.equal((await synchronize({ plan, state, save, create }))[0].status, 'blocked');
  state.versions[plan[0].key].status = 'pending';
  assert.equal((await synchronize({ plan, state, save, create }))[0].status, 'blocked');
  assert.equal(calls, 1);
  assert.equal((await synchronize({ plan: [{ ...plan[0], remoteId: 99 }], state, save, create }))[0].status, 'adopted');
  assert.equal(state.versions[plan[0].key].id, 99);
});

test('unavailable ancestors and failed durable checkpoints prevent the POST', async () => {
  const plan = planFor([submission], {}, false, () => metadata({ ancestors: [{ github: 'missing', version: 'missing1016' }] }));
  const state = newState(endpoint);
  const create = async () => assert.fail('must not upload');
  assert.equal((await synchronize({ plan, state, save: async () => {}, create }))[0].status, 'blocked');
  const ready = planFor([submission], {}, false, () => metadata());
  await assert.rejects(synchronize({ plan: ready, state, save: async () => { throw new Error('checkpoint failed'); }, create }), /checkpoint failed/);
  assert.throws(() => validateState(state, 'https://other.example/create_version'), /不一致/);
});

test('GitHub state storage uses a separate branch and the contents SHA for optimistic locking', async () => {
  const requests = [];
  const state = newState(endpoint);
  const store = githubStore({
    repository: 'example/repo', token: 'test-only', branch: 'sync-state', endpoint,
    fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        assert.equal(body.branch, 'sync-state');
        assert.equal(body.sha, 'previous-sha');
        assert.deepEqual(JSON.parse(Buffer.from(body.content, 'base64').toString()), state);
        return new Response(JSON.stringify({ content: { sha: 'new-sha' } }));
      }
      if (url.includes('/contents/')) return new Response(JSON.stringify({ sha: 'previous-sha', content: Buffer.from(JSON.stringify(state)).toString('base64') }));
      return new Response(JSON.stringify({ object: { sha: 'head-sha' } }));
    },
  });
  assert.deepEqual(await store.load(), state);
  state.versions['test_paper/alice1027'] = { status: 'synced', id: 42, fingerprint: 'test' };
  await store.save(state);
  await store.save(state);
  assert.equal(requests.filter((request) => request.method === 'PUT').length, 1);
});

test('existing state branch with a missing file cannot silently become an empty import ledger', async () => {
  const store = githubStore({
    repository: 'example/repo', token: 'test-only', branch: 'sync-state', endpoint,
    fetchImpl: async (url) => url.includes('/contents/')
      ? new Response('', { status: 404 })
      : new Response(JSON.stringify({ object: { sha: 'head-sha' } })),
  });
  await assert.rejects(store.load(), /恢复文件/);
});

test('first run creates the dedicated state branch and writes a checkpoint before any import', async () => {
  const calls = [];
  const store = githubStore({
    repository: 'example/repo', token: 'test-only', branch: 'sync-state', endpoint,
    fetchImpl: async (url, options) => {
      calls.push({ url, ...options });
      if (url.endsWith('/git/ref/heads/sync-state') || url.includes('/contents/') && options.method === 'GET') return new Response('', { status: 404 });
      if (url.endsWith('/repos/example/repo')) return new Response(JSON.stringify({ default_branch: 'main' }));
      if (url.endsWith('/git/ref/heads/main')) return new Response(JSON.stringify({ object: { sha: 'main-sha' } }));
      if (options.method === 'POST') {
        assert.deepEqual(JSON.parse(options.body), { ref: 'refs/heads/sync-state', sha: 'main-sha' });
        return new Response(JSON.stringify({ ref: 'refs/heads/sync-state' }), { status: 201 });
      }
      assert.equal(options.method, 'PUT');
      assert.ok(!Object.hasOwn(JSON.parse(options.body), 'sha'));
      return new Response(JSON.stringify({ content: { sha: 'initial-sha' } }), { status: 201 });
    },
  });
  const state = await store.load();
  assert.deepEqual(state, newState(endpoint));
  await store.save(state);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1);
  assert.equal(calls.filter((call) => call.method === 'PUT').length, 1);
});

test('first remote failure defers other new versions without marking them as attempted', async () => {
  const plan = planFor([submission, { paperName: 'test_paper', version: 'bob1027' }], {}, false,
    (item) => metadata({ version: item.version }));
  const state = newState(endpoint);
  let calls = 0;
  const results = await synchronize({ plan, state, save: async () => {}, create: async () => { calls += 1; throw new Error('auth rejected'); } });
  assert.deepEqual(results.map((row) => row.status), ['uncertain', 'deferred']);
  assert.equal(calls, 1);
  assert.ok(!state.versions['test_paper/bob1027']);
});

test('business 404 skips only the missing paper, continues the batch, and retries it only after correction', async () => {
  const plan = planFor([submission, { paperName: 'test_paper', version: 'bob1027' }], {}, false,
    (item) => metadata({ version: item.version }));
  const state = newState(endpoint);
  let calls = 0;
  const create = async (payload) => {
    calls += 1;
    return createVersion(endpoint, payload, {}, async () => Response.json(payload.version_name === 'alice1027'
      ? { code: 404, msg: 'not found', data: [] } : { code: 200, data: { id: 42 } }));
  };
  const save = async () => {};
  assert.deepEqual((await synchronize({ plan, state, save, create })).map(row => row.status), ['skipped', 'created']);
  assert.deepEqual((await synchronize({ plan, state, save, create })).map(row => row.status), ['skipped', 'unchanged']);
  assert.equal(calls, 2, 'unchanged missing identifiers must not be retried');
  const corrected = { ...plan[0], fingerprint: 'corrected', payload: { ...plan[0].payload, arxiv_id: '2403.11549' } };
  assert.equal((await synchronize({ plan: [corrected], state, save, create: async () => 43 }))[0].id, 43);
});

test('HTTP 404 and contradictory business responses still require reconciliation', async () => {
  for (const response of [new Response('not found', { status: 404 }), Response.json({ code: 404, data: { id: 99 } })]) {
    await assert.rejects(createVersion(endpoint, {}, {}, async () => response), error => !error.paperNotFound);
  }
});

test('confirmed absence unlocks only the exact old attempt with a corrected payload, once', async () => {
  const old = planFor([submission], {}, false, () => metadata())[0];
  const corrected = planFor([submission], { 'test_paper/alice1027': { arxiv_id: '2403.11549', confirmed_missing_fingerprint: old.fingerprint } }, false, () => metadata())[0];
  assert.equal(corrected.payload.arxiv_id, '2403.11549');
  assert.ok(!Object.hasOwn(corrected.payload, 'confirmed_missing_fingerprint'));
  assert.throws(() => payloadFor(submission, metadata(), { confirmed_missing_fingerprint: 'invalid' }), /SHA-256/);
  for (const candidate of [{ ...corrected, confirmedMissingFingerprint: 'different' }, { ...old, confirmedMissingFingerprint: old.fingerprint }]) {
    const state = newState(endpoint);
    state.versions[old.key] = { status: 'uncertain', fingerprint: old.fingerprint };
    assert.equal((await synchronize({ plan: [candidate], state, save: async () => {}, create: async () => assert.fail('must not retry') }))[0].status, 'blocked');
  }
  for (const succeeds of [true, false]) {
    const state = newState(endpoint);
    state.versions[old.key] = { status: 'uncertain', fingerprint: old.fingerprint };
    let calls = 0;
    const run = () => synchronize({ plan: [corrected], state, save: async () => {}, create: async () => {
      calls += 1;
      if (!succeeds) throw new Error('timeout');
      return 77;
    } });
    assert.equal((await run())[0].status, succeeds ? 'created' : 'uncertain');
    assert.equal((await run())[0].status, succeeds ? 'unchanged' : 'blocked');
    assert.equal(calls, 1);
  }
});

test('transient GitHub read failures retry, while permission failures stop immediately', async () => {
  for (const status of [503, 403]) {
    let calls = 0;
    const store = githubStore({ repository: 'example/repo', token: 'test-only', branch: 'sync-state', endpoint,
      sleep: async () => {},
      fetchImpl: async (url) => {
        calls += 1;
        if (calls === 1) return new Response('', { status });
        if (url.includes('/contents/')) return Response.json({ sha: 'old', content: Buffer.from(JSON.stringify(newState(endpoint))).toString('base64') });
        return Response.json({ object: { sha: 'head' } });
      },
    });
    if (status === 403) {
      await assert.rejects(store.load(), /HTTP 403/);
      assert.equal(calls, 1);
    } else {
      assert.deepEqual(await store.load(), newState(endpoint));
      assert.equal(calls, 3);
    }
  }
});

test('missing arXiv identifiers and their dependent versions are skipped without any POST or ledger entry', async () => {
  const child = { paperName: 'test_paper', version: 'bob1027' };
  const plan = planFor([submission, child], {}, false, item => metadata(item.version === 'alice1027'
    ? { paperUrl: 'https://doi.org/10.1000/example' }
    : { version: item.version, ancestors: [{ github: 'alice', version: 'alice1027' }] }));
  const state = newState(endpoint);
  const rows = await synchronize({ plan, state, save: async () => {}, create: async () => assert.fail('must not POST skipped projects') });
  assert.deepEqual(rows.map(row => row.status), ['skipped', 'skipped']);
  assert.deepEqual(rows.map(row => row.skip_reason), ['missing_arxiv_id', 'ancestor_not_synced']);
  assert.deepEqual(state.versions, {});
  const fixed = planFor([submission], {}, false, () => metadata());
  assert.equal((await synchronize({ plan: fixed, state, save: async () => {}, create: async () => 42 }))[0].status, 'created');
});

test('checkpoint recovery reads back ambiguous writes without duplicating database creates or overwriting concurrent changes', async () => {
  for (const failure of ['not-committed', 'committed', 'lost-response', 'conflict', 'persistent']) {
    let stored = newState(endpoint);
    let storedSha = 'old';
    let puts = 0;
    let creates = 0;
    const store = githubStore({ repository: 'example/repo', token: 'test-only', branch: 'sync-state', endpoint,
      sleep: async () => {},
      fetchImpl: async (url, options) => {
        if (options.method !== 'PUT') return url.includes('/contents/')
          ? Response.json({ sha: storedSha, content: Buffer.from(JSON.stringify(stored)).toString('base64') })
          : Response.json({ object: { sha: 'head' } });
        puts += 1;
        const body = JSON.parse(options.body);
        assert.equal(body.sha, storedSha);
        // The first PUT saves intent; the second saves the actual successful ID.
        if (puts === 2 || failure === 'persistent' && puts > 2) {
          if (['committed', 'lost-response'].includes(failure)) {
            stored = JSON.parse(Buffer.from(body.content, 'base64').toString());
            storedSha = 'committed-after-error';
          }
          if (failure === 'conflict') storedSha = 'another-writer';
          if (failure === 'lost-response') throw new Error('socket reset after commit');
          return new Response('', { status: 503 });
        }
        stored = JSON.parse(Buffer.from(body.content, 'base64').toString());
        storedSha = `saved-${puts}`;
        return Response.json({ content: { sha: storedSha } });
      },
    });
    const state = await store.load();
    const plan = planFor([submission], {}, false, () => metadata());
    const results = [];
    const run = () => synchronize({ plan, state, save: (value) => store.save(value),
      create: async () => { creates += 1; return 42; }, onResult: (row) => results.push(row) });
    if (['conflict', 'persistent'].includes(failure)) {
      await assert.rejects(run(), failure === 'conflict' ? /其他写入/ : /HTTP 503/);
      assert.equal(results[0].id, 42, 'the recovery report retains the ID even if checkpoint storage fails');
      assert.equal(puts, failure === 'persistent' ? 5 : 2);
    } else {
      await run();
      assert.equal(stored.versions[plan[0].key].id, 42);
      assert.equal(puts, failure === 'not-committed' ? 3 : 2);
      const reloaded = await store.load();
      assert.equal((await synchronize({ plan, state: reloaded, save: (value) => store.save(value), create: async () => assert.fail('must not recreate') }))[0].status, 'unchanged');
    }
    assert.equal(creates, 1);
  }
});
