'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const source = path.resolve(__dirname, '../../../..');
const first = 'html_output/same_paper/alice1124';
const second = 'html_output/same_paper/bob1125';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperskill-build-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  };
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  };
  const run = () => {
    const result = spawnSync(process.execPath, ['.github/scripts/publication/build-changed.js'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_BASE_REF: 'main' },
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  };
  const commit = () => {
    git('add', '-A');
    git('commit', '-qm', 'fixture');
  };
  for (const file of ['.github/scripts/publication/build-changed.js', 'scripts/lib/repository.js']) {
    write(file, fs.readFileSync(path.join(source, file)));
  }
  write('scripts/build-changed.js', 'console.log("existing build path");');
  write('scripts/build-all.js', 'console.log(JSON.stringify(process.argv.slice(2)));');
  write(first + '/paper.json', '{}');
  write(second + '/paper.json', '{}');
  write(second + '/index.html', 'before');
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Build test');
  git('config', 'user.email', 'build@example.invalid');
  git('config', 'core.hooksPath', path.join(root, 'no-hooks'));
  commit();
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  return { write, commit, run, remove: dir => fs.rmSync(path.join(root, dir), { recursive: true }) };
}

test('complete removal skips missing targets and still builds remaining edits', t => {
  const f = fixture(t);
  f.remove(first);
  f.commit();
  assert.match(f.run(), /没有剩余/);
  f.write(second + '/index.html', 'after');
  f.commit();
  assert.deepEqual(JSON.parse(f.run()), ['--output', 'site/papers', '--paper', 'same_paper/bob1125']);
});

test('ordinary submissions and shared changes retain the existing build path', t => {
  const f = fixture(t);
  f.write(second + '/index.html', 'ordinary edit');
  f.commit();
  assert.equal(f.run(), 'existing build path');
  f.remove(first);
  f.write('scripts/new.js', '');
  f.commit();
  assert.equal(f.run(), 'existing build path');
});