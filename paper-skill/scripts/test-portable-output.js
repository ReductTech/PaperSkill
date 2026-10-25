// Exercise the copied Phase 2 helpers as an independent temporary skill.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const source = path.join(__dirname, '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-skill-portable-'));
const tempSkill = path.join(root, 'paperSkill');
const output = path.join(root, 'fixture_output');
const work = path.join(root, 'work');
const packetDir = path.join(work, 'packets', 'all');

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(tempSkill, script), ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }

try {
  fs.mkdirSync(tempSkill, { recursive: true });
  for (const name of ['contract.md', 'scripts/scaffold.js', 'scripts/assemble-chapter-packets.js',
    'scripts/syntax-check.js', 'scripts/validate-output.js']) {
    fs.copyFileSync(path.join(source, name), path.join(tempSkill, path.basename(name)));
  }
  const staged = spawnSync(process.execPath, [path.join(source, 'scripts', 'stage-template.js'), tempSkill], { encoding: 'utf8' });
  assert.equal(staged.status, 0, staged.stderr);
  assert.equal(fs.existsSync(path.join(tempSkill, 'assets', 'react-template', 'src', 'modules', 'MountainJourney.tsx')), false);
  assert.equal(fs.existsSync(path.join(tempSkill, 'assets', 'react-template', 'src', 'data', 'tutorial.ts')), false);
  for (const [file, original] of [
    ['MountainJourney.tsx', 'src/modules/MountainJourney.tsx'],
    ['MountainJourney.css', 'src/modules/MountainJourney.css'],
    ['tutorial.ts', 'src/data/tutorial.ts'],
  ]) {
    assert.equal(fs.readFileSync(path.join(tempSkill, 'assets', 'layout-gallery', 'teaching-demo', file), 'utf8'),
      fs.readFileSync(path.join(source, 'assets', 'react-template', original), 'utf8'));
  }
  const gallery = fs.readFileSync(path.join(tempSkill, 'assets', 'layout-gallery', 'catalog.md'), 'utf8');
  const previews = fs.readFileSync(path.join(tempSkill, 'assets', 'layout-gallery', 'index.html'), 'utf8');
  for (let i = 1; i <= 8; i++) {
    const id = `L${String(i).padStart(2, '0')}`;
    assert.ok(gallery.includes(id) && previews.includes(id), `Missing slide reference ${id}`);
  }
  for (const name of ['SKILL.md', 'contract.md', 'references/presentation-standard.md',
    'references/metaphor-library.md', 'scripts/generation-pipeline.md']) {
    const stagedGuide = path.join(tempSkill, 'assets', 'global-guides', name);
    assert.equal(fs.existsSync(stagedGuide), true, `Missing global guide ${name}`);
    assert.equal(fs.readFileSync(stagedGuide, 'utf8'), fs.readFileSync(path.join(source, name), 'utf8'));
  }
  assert.equal(run('scaffold.js', [output, 'fixture-output', 'Fixture Paper', '测试论文']).status, 0);
  assert.equal(fs.existsSync(path.join(output, 'assets', 'layout-gallery')), false);
  assert.equal(fs.existsSync(path.join(output, 'assets', 'global-guides')), false);
  assert.equal(fs.existsSync(path.join(output, 'src', 'modules', 'MountainJourney.tsx')), false);

  fs.mkdirSync(path.join(packetDir, 'modules'), { recursive: true });
  const widgets = [];
  writeJson(path.join(work, 'shared.json'), {
    meta: { titleEn: 'Fixture Paper', titleZh: '测试论文', venue: 'test', authors: 'test',
      affiliation: 'test', domain: 'test', coreProblem: 'problem', coreInsight: 'insight', keywords: [] },
    hero: { oldMethod: { title: 'Old', desc: 'old', componentId: 'fixture-1-1' },
      newMethod: { title: 'New', desc: 'new', componentId: 'fixture-1-1' } },
  });
  const chapters = [];
  for (let n = 1; n <= 12; n++) {
    const moduleCount = n === 1 ? 2 : 1;
    const modules = Array.from({ length: moduleCount }, (_, i) => {
      const componentId = `fixture-${n}-${i + 1}`;
      const exportName = `Fixture${n}_${i + 1}`;
      const file = `modules/${componentId}.tsx`;
      widgets.push({ componentId, exportName, file });
      fs.writeFileSync(path.join(packetDir, file), `export function ${exportName}() { return null; }\n`);
      return { kind: 'module', id: `${n}.${i + 1}`, title: `模块 ${n}.${i + 1}`,
        desc: '交互说明', componentId };
    });
    const scenes = modules.map((module, i) => ({
      id: `chap-${n}-scene-${i + 1}`, title: '科学概念', goal: '操作目标', summary: '科学结论',
      interaction: '操作画布', next: '', notes: '来源与边界', componentId: module.componentId,
      moduleId: module.id,
    }));
    const name = `chapter-${n}.json`;
    chapters.push(name);
    writeJson(path.join(packetDir, name), { kind: 'chapter', id: `chap-${n}`,
      title: `第 ${n} 章`, modules, scenes });
  }
  writeJson(path.join(packetDir, 'packet.json'), { chapters, widgets });
  const assembled = run('assemble-chapter-packets.js', [output, work]);
  assert.equal(assembled.status, 0, assembled.stderr);
  const paperCss = path.join(output, 'src', 'styles', 'paper.css');
  fs.writeFileSync(paperCss, fs.readFileSync(paperCss, 'utf8').replace('__METAPHOR_CSS__', '--paper-scene-bg: #f5f8f0;'));

  const valid = run('validate-output.js', [output]);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  assert.match(valid.stdout, /chapter count = 12 \(no numeric limit\)/);
  assert.doesNotMatch(valid.stdout + valid.stderr, /framework differs|unexpected framework/);

  const outlinePath = path.join(output, 'outlines.json');
  const outline = JSON.parse(fs.readFileSync(outlinePath, 'utf8'));
  assert.ok(outline.pages.every(page => !Object.hasOwn(page, 'layoutFamily')));

  const widgetPath = path.join(output, 'src', 'modules', 'fixture-1-1.tsx');
  const cleanWidget = fs.readFileSync(widgetPath, 'utf8');
  fs.writeFileSync(widgetPath, cleanWidget.replace('return null', 'return <div>论文机制 / 证据</div>'));
  const stiff = run('validate-output.js', [output]);
  assert.equal(stiff.status, 0, stiff.stdout + stiff.stderr);
  assert.match(stiff.stdout, /generic paper-evidence heading/);
  fs.writeFileSync(widgetPath, cleanWidget);

  const presentationCss = path.join(output, 'src', 'styles', 'presentation.css');
  const original = fs.readFileSync(presentationCss);
  fs.appendFileSync(presentationCss, '\n/* old layout drift */\n');
  const changed = run('validate-output.js', [output]);
  assert.equal(changed.status, 0, changed.stdout + changed.stderr);

  fs.writeFileSync(presentationCss, original);

  const stray = path.join(output, 'src', 'components', 'LegacyRecap.tsx');
  fs.writeFileSync(stray, 'export const LegacyRecap = () => null;\n');
  const added = run('validate-output.js', [output]);
  assert.equal(added.status, 0, added.stdout + added.stderr);


  fs.unlinkSync(presentationCss);
  fs.unlinkSync(outlinePath);
  const legacy = run('validate-output.js', [output]);
  assert.equal(legacy.status, 0, legacy.stdout + legacy.stderr);

  const registryPath = path.join(output, 'src', 'modules', 'registry.tsx');
  const registry = fs.readFileSync(registryPath, 'utf8');
  fs.writeFileSync(registryPath, 'export const widgetRegistry = {' + widgets.map(w => JSON.stringify(w.componentId) + ': () => null').join(',') + '};');
  const objectRegistry = run('validate-output.js', [output]);
  assert.equal(objectRegistry.status, 0, objectRegistry.stdout + objectRegistry.stderr);
  fs.writeFileSync(registryPath, 'export const widgetRegistry = {};');
  const missingWidget = run('validate-output.js', [output]);
  assert.equal(missingWidget.status, 1);
  assert.match(missingWidget.stderr, /not registered/);
  fs.writeFileSync(registryPath, registry);

  const entry = path.join(output, 'src', 'main.tsx');
  const entrySource = fs.readFileSync(entry);
  fs.unlinkSync(entry);
  const missingEntry = run('validate-output.js', [output]);
  assert.equal(missingEntry.status, 1);
  assert.match(missingEntry.stderr, /missing required file: src\/main.tsx/);
  fs.writeFileSync(entry, entrySource);

  const parser = path.join(source, 'assets', 'react-template', 'node_modules', 'typescript');
  assert.ok(fs.existsSync(parser), 'Install template dependencies before running the syntax regression');
  fs.mkdirSync(path.join(output, 'node_modules'), { recursive: true });
  fs.symlinkSync(parser, path.join(output, 'node_modules', 'typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  fs.writeFileSync(widgetPath, 'export function Broken() { return <div>');
  const broken = run('validate-output.js', [output]);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /syntax error/);
  console.log('PASS: template changes, legacy components, optional outlines and object registries accepted; missing entries, unregistered widgets and syntax errors rejected.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
