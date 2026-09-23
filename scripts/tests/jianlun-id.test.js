'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const repo = require('../lib/repository');

// Run the real import/modify/catalog commands in an isolated repository.
test('Jianlun ID survives import and catalog; copied versions use their own identity', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperskill-jianlun-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  for (const file of ['import-paper.js', 'modify-version.js', 'generate-catalog.js', 'lib/repository.js']) {
    fs.copyFileSync(path.join(__dirname, '..', file), path.join(root, 'scripts', file));
  }
  fs.mkdirSync(path.join(root, 'paper-skill'));
  fs.copyFileSync(path.join(repo.ROOT, 'paper-skill', 'VERSION'), path.join(root, 'paper-skill', 'VERSION'));
  fs.mkdirSync(path.join(root, 'source'));
  fs.writeFileSync(path.join(root, 'source', 'package.json'), '{"name":"fixture"}');
  const run = (file, args = []) => {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', file), ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  const readVersion = (version) => JSON.parse(fs.readFileSync(path.join(root, 'html_output', 'test_paper', version, 'paper.json'), 'utf8'));
  const id = '00AbCd' + '1234567890abcdef'.repeat(8);
  const args = ['source', 'test_paper', '--title', 'Test paper', '--paper-url', 'https://example.com/paper', '--participant', '测试者', '--pinyin', 'tester', '--github', '@test-user', '--date', '2026-09-23'];
  run('import-paper.js', [...args, '--jianlun-id', `  ${id}  `]);
  const original = readVersion('tester0923');
  assert.equal(original.participants[0].jianlunId, id);
  assert.deepEqual(repo.validateMetadata(original, 'test_paper', 'tester0923'), []);
  for (const [version, extra] of [['empty0923', []], ['blank0923', ['--jianlun-id', '   ']]]) {
    run('import-paper.js', [...args, '--version', version, ...extra]);
    assert.ok(!Object.hasOwn(readVersion(version).participants[0], 'jianlunId'));
  }
  for (const [version, extra, expected] of [
    ['next0923', ['--jianlun-id', '  000NewCaseID  '], '000NewCaseID'],
    ['none0923', [], undefined],
  ]) {
    run('modify-version.js', ['test_paper/tester0923', '--participant', '修改者', '--github', 'next-user', '--version', version, '--date', '2026-09-23', ...extra]);
    const modified = readVersion(version);
    assert.equal(modified.participants[0].jianlunId, expected);
    assert.deepEqual(modified.ancestors, [{ github: 'test-user', version: 'tester0923' }]);
  }
  assert.deepEqual(readVersion('tester0923'), original);
  run('generate-catalog.js');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'papers.json'), 'utf8'));
  assert.equal(catalog[0].versions.find((v) => v.version === 'tester0923').participants[0].jianlunId, id);
  assert.equal(catalog[0].versions.find((v) => v.version === 'none0923').participants[0].jianlunId, undefined);
  original.participants[0].jianlunId = 123;
  assert.ok(repo.validateMetadata(original, 'test_paper', 'tester0923').some((error) => error.includes('jianlunId')));
});

function loadPortal() {
  const elements = new Map();
  const clipboardWrites = [];
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', innerHTML: '', textContent: '', hidden: true, style: {}, listeners: {},
      addEventListener(event, handler) { this.listeners[event] = handler; },
      insertAdjacentHTML() {}, scrollIntoView() {}, focus() { this.focused = true; },
    });
    return elements.get(selector);
  };
  const context = vm.createContext({
    document: { querySelector: element, querySelectorAll: () => [], addEventListener() {}, body: { style: {} } },
    navigator: { clipboard: { writeText(value) { clipboardWrites.push(value); return Promise.resolve(); } } },
    fetch: () => new Promise(() => {}),
  });
  vm.runInContext(fs.readFileSync(path.join(repo.ROOT, 'portal', 'app.js'), 'utf8'), context);
  return { context, element, clipboardWrites };
}

test('version modal hides long IDs behind a copyable detail dialog', async () => {
  const { context, element, clipboardWrites } = loadPortal();
  const id = '00ABC' + 'abcdef0123456789'.repeat(8);
  context.fixtureVersions = [
    { version: 'tester0923', participants: [{ name: '测试者', github: 'same-user', jianlunId: id }], tutorialUrl: 'papers/test/tester0923/', status: 'review' },
    { version: 'tester0922', participants: [{ name: '测试者', github: 'same-user' }], tutorialUrl: 'papers/test/tester0922/', status: 'review' },
  ];
  vm.runInContext("cardList = [{title: 'Test', paperName: 'test', groups: groupVersions(fixtureVersions)}]; openVersionModal(0, 0);", context);
  const html = element('#modal-versions').innerHTML;
  assert.ok(!html.includes(id));
  assert.equal((html.match(/减论 ID/g) || []).length, 2);
  assert.equal((html.match(/class="jianlun-view"/g) || []).length, 1);
  assert.equal((html.match(/暂无/g) || []).length, 1);
  assert.equal(element('#version-modal').hidden, false);
  vm.runInContext("openJianlunModal(modalJianlunIds.get('0:0'))", context);
  assert.equal(element('#jianlun-id-value').textContent, id);
  assert.equal(element('#jianlun-modal').hidden, false);
  await element('#jianlun-copy').listeners.click();
  assert.deepEqual(clipboardWrites, [id]);
  assert.equal(element('#jianlun-copy').textContent, '已复制');
  for (const idValue of [undefined, '', '   ', null]) {
    context.fixtureId = idValue;
    assert.match(vm.runInContext('versionJianlunIds({participants:[{jianlunId:fixtureId}]})', context), /暂无/);
  }
  context.fixtureId = '<img src=x onerror="alert(1)">';
  vm.runInContext("modalJianlunIds.clear(); versionJianlunIds({participants:[{jianlunId:fixtureId}]}); openJianlunModal(modalJianlunIds.get('0:0'))", context);
  assert.equal(element('#jianlun-id-value').textContent, context.fixtureId);
  assert.match(vm.runInContext("versionJianlunIds({participants:[{name:'A',jianlunId:'A1'},{name:'B'}]})", context), /A · 减论 ID[\s\S]*查看[\s\S]*B · 减论 ID[\s\S]*暂无/);
});

test('starter form includes an optional Jianlun ID in the import command', () => {
  const { element } = loadPortal();
  for (const [key, value] of Object.entries({ title: 'Test', url: 'https://example.com', 'paper-name': 'test', source: 'test-user', name: 'Test', pinyin: 'tester', 'jianlun-id': '  00AbCd  ' })) {
    element(`#start-${key}`).value = value;
  }
  const submit = () => element('#starter-form').listeners.submit({ preventDefault() {} });
  submit();
  assert.ok(element('#import-command').textContent.endsWith("--jianlun-id '00AbCd'"));
  element('#start-jianlun-id').value = '  ';
  submit();
  assert.ok(!element('#import-command').textContent.includes('--jianlun-id'));
});
