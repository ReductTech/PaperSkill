import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temp = mkdtempSync(join(tmpdir(), 'act2see-progress-'));
try {
  const transpile = (file, output) => writeFileSync(join(temp, output), ts.transpileModule(
    readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8').replace("from './content'", "from './content.mjs'"),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
  ).outputText);
  transpile('content.ts', 'content.mjs');
  transpile('tutorialProgress.ts', 'tutorialProgress.mjs');
  const { migrateV1, parseV2, loadProgress, saveProgress, freshProgress } = await import(pathToFileURL(join(temp, 'tutorialProgress.mjs')).href);
  const expectedUnlock = [0, 1, 1, 3, 3, 3, 3, 6, 6, 6, 6, 8, 8, 9];
  for (let old = 0; old <= 13; old++) {
    const result = migrateV1(JSON.stringify({ unlocked: old, completed: Math.max(0, old - 1), review: false }));
    assert.equal(result.unlocked, expectedUnlock[old], `old unlocked ${old}`);
    assert.ok(result.completed <= Math.max(0, result.unlocked - 1));
    assert.equal(result.review, false);
    assert.equal(result.activeId, null);
  }
  assert.deepEqual(migrateV1(JSON.stringify({ unlocked: 13, completed: 13, review: true })),
    { version: 2, unlocked: 9, completed: 8, activeId: null, review: false });
  for (const raw of ['{broken', '[]', '{}', '{"unlocked":14,"completed":0}', '{"unlocked":-1,"completed":0}', '{"unlocked":2.5,"completed":0}', '{"unlocked":2,"completed":3}', '{"unlocked":1,"completed":"1"}', '{"unlocked":1,"completed":0,"version":3}']) {
    assert.equal(migrateV1(raw), null, raw);
  }
  for (const raw of ['{broken', '{}', '{"version":3,"unlocked":1,"completed":0,"activeId":null,"review":false}', '{"version":2,"unlocked":10,"completed":0,"activeId":null,"review":false}', '{"version":2,"unlocked":1,"completed":0,"activeId":"cases","review":false}']) {
    assert.equal(parseV2(raw), null, raw);
  }
  const store = new Map([['act2see-tutorial-v1', JSON.stringify({ unlocked: 13, completed: 13, review: true })]]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const migrated = loadProgress();
  saveProgress(migrated);
  assert.equal(store.has('act2see-tutorial-v1'), true);
  assert.deepEqual(loadProgress(), migrated);
  saveProgress(freshProgress());
  assert.deepEqual(loadProgress(), freshProgress());
  assert.equal(store.has('act2see-tutorial-v1'), true);
  globalThis.localStorage = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
  assert.deepEqual(loadProgress(), freshProgress());
  assert.doesNotThrow(() => saveProgress(freshProgress()));
  console.log('Progress migration: v1 unlocked 0–13, full completion, malformed data, v2 restore/reset, and storage failures passed.');
} finally { rmSync(temp, { recursive: true, force: true }); }
