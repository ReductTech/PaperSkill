'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { validatePaperFormat } = require('./validate-paper-format');

const rootDir = path.resolve(__dirname, '..', '..');
const paper = 'html_output/example_paper';
const first = paper + '/alice1124';
const second = paper + '/bob1125';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperskill-format-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.error?.message || result.stderr);
    return result.stdout.trim();
  };
  const write = (file, body = '{}') => {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, body);
  };
  const remove = file => fs.rmSync(path.join(root, file), { recursive: true });
  const metadata = (key, fields = {}) => {
    const [, paperName, version] = key.split('/');
    write(key + '/paper.json', JSON.stringify({
      schemaVersion: 1, paperName, version, title: 'Example paper', paperUrl: 'https://arxiv.org/abs/1706.03762',
      participants: [{ name: 'Alice', github: 'alice' }], topics: [], entry: 'index.html',
      status: 'review', skillVersion: '1.0.0', ...fields,
    }));
  };
  const version = key => {
    for (const name of ['README.md', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json',
      'src/App.tsx', 'src/main.tsx', 'src/modules/registry.tsx', 'src/styles/paper.css', 'src/data/tutorial.ts',
      'public/images/example.png']) write(key + '/' + name);
    metadata(key);
  };
  const commit = () => {
    git('add', '-A');
    git('commit', '-qm', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Format test');
  git('config', 'user.email', 'format-test@example.invalid');
  git('config', 'core.hooksPath', path.join(root, 'no-hooks'));
  write('html_output/README.md', 'Instructions');
  const base = commit();
  return { root, base, git, write, remove, metadata, version, commit,
    validate: (from = base, to = 'HEAD') => validatePaperFormat(root, from, to) };
}

test('first submission and an added version of an existing paper pass', t => {
  const f = fixture(t);
  f.version(first);
  const existing = f.commit();
  assert.deepEqual(f.validate(), { versions: [first], errors: [] });
  f.version(second);
  f.commit();
  assert.deepEqual(f.validate(existing), { versions: [second], errors: [] });
});

test('#519 flat files fail even if an existing version is valid, and #535 cleanup passes', t => {
  const f = fixture(t);
  f.version(first);
  const clean = f.commit();
  for (const file of ['index.html', 'assets/bundle.js', 'images/图 一.png']) f.write(paper + '/' + file);
  const malformed = f.commit();
  assert.equal(f.validate(clean).errors.length, 3);
  f.git('revert', '--no-edit', malformed);
  assert.deepEqual(f.validate(malformed), { versions: [], errors: [] });
});

test('invalid version names, versionless new papers and missing metadata fail', t => {
  const f = fixture(t);
  f.version(first);
  const base = f.commit();
  f.write('html_output/NEW_PAPER/alice1124/index.html');
  f.write(paper + '/bad_version/index.html');
  f.write(second + '/index.html');
  f.commit();
  const { errors } = f.validate(base);
  assert.match(errors.join('\n'), /NEW_PAPER/);
  assert.match(errors.join('\n'), /bad_version/);
  assert.match(errors.join('\n'), /bob1125.*缺少普通文件 paper\.json/);
});

test('uses existing metadata rules for version identity and valid GitHub attribution', t => {
  const f = fixture(t);
  f.version(first);
  f.metadata(first, { version: 'wrong1124', participants: [{ name: 'Alice', github: 'bad handle' }] });
  f.commit();
  const messages = f.validate().errors.join('\n');
  assert.match(messages, /version 必须与版本目录名一致/);
  assert.match(messages, /GitHub 用户名/);
});

test('partial deletion fails if a required file is lost but whole-version removal passes this gate', t => {
  const f = fixture(t);
  f.version(first);
  f.version(second);
  const existing = f.commit();
  f.remove(first + '/paper.json');
  f.remove(second + '/src/main.tsx');
  f.commit();
  const partial = f.validate(existing).errors.join('\n');
  assert.match(partial, /alice1124.*缺少普通文件 paper\.json/);
  assert.match(partial, /bob1125.*缺少普通文件 src\/main\.tsx/);
  f.git('reset', '--hard', existing);
  f.remove(first);
  f.commit();
  assert.deepEqual(f.validate(existing), { versions: [], errors: [] });
});

test('editing files with spaces or Unicode and removing a non-required file pass', t => {
  const f = fixture(t);
  f.version(first);
  const existing = f.commit();
  f.write(first + '/public/图 一.txt', 'fixture');
  f.remove(first + '/public/images/example.png');
  f.commit();
  assert.deepEqual(f.validate(existing), { versions: [first], errors: [] });
});

test('checks the new path on rename and ignores unchanged historical flat files', t => {
  const f = fixture(t);
  f.version(first);
  f.write(paper + '/assets/legacy.js');
  const existing = f.commit();
  fs.renameSync(path.join(f.root, first), path.join(f.root, second));
  f.metadata(second);
  const renamed = f.commit();
  assert.deepEqual(f.validate(existing), { versions: [second], errors: [] });
  f.git('mv', second + '/index.html', paper + '/index.html');
  f.commit();
  assert.match(f.validate(renamed).errors.join('\n'), /请将论文文件提交到 html_output/);
});

test('enforces regular files, forbidden directories and the exact README exception', t => {
  const f = fixture(t);
  f.version(first);
  f.write('docs/example.md');
  f.write('html_output/README.md', 'Updated instructions');
  const clean = f.commit();
  assert.deepEqual(f.validate(), { versions: [first], errors: [] });
  f.write(paper + '/README.md');
  f.write(first + '/dist/asset.js');
  f.commit();
  const blob = f.git('rev-parse', 'HEAD:html_output/README.md');
  f.git('update-index', '--cacheinfo', '120000,' + blob + ',' + first + '/paper.json');
  f.git('commit', '-qm', 'test non-regular metadata');
  const errors = f.validate(clean).errors.join('\n');
  assert.match(errors, /example_paper\/README\.md.*请将论文文件提交/);
  assert.match(errors, /dist\/asset\.js/);
  assert.match(errors, /paper\.json.*必须是普通文件/);
});

test('Fork-style merge checkout works with depth 2 and ignores other upstream papers', t => {
  const f = fixture(t);
  f.git('remote', 'add', 'origin', 'https://example.invalid/upstream');
  f.git('switch', '-qc', 'contributor', f.base);
  f.version(first);
  f.commit();
  f.git('switch', '-q', 'main');
  f.version('html_output/other_paper/carol1125');
  const upstream = f.commit();
  f.git('switch', '-qc', 'pr-merge');
  f.git('merge', '--no-ff', '--no-edit', 'contributor');
  const checkout = path.join(f.root, 'checkout');
  f.git('clone', '-q', '--no-local', '--depth=2', '--branch', 'pr-merge', f.root, checkout);
  for (const file of ['.github/scripts/validate-paper-format.js', 'scripts/lib/repository.js', 'scripts/lib/github-identity.js']) {
    const destination = path.join(checkout, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(rootDir, file), destination);
  }
  const result = spawnSync(process.execPath, [
    path.join(checkout, '.github/scripts/validate-paper-format.js'), upstream, 'HEAD',
  ], { cwd: checkout, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /example_paper\/alice1124/);
  assert.doesNotMatch(result.stdout, /other_paper/);
});

test('a docs-only PR succeeds and a missing base fails closed', t => {
  const f = fixture(t);
  f.write('docs/update.md', 'A docs-only update');
  f.commit();
  assert.deepEqual(f.validate(), { versions: [], errors: [] });
  assert.throws(() => f.validate('missing'), /Git 查询失败/);
});
