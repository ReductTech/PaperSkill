// Regression checks for the scene packet contract, without running a browser.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-scenes-'));
const output = path.join(root, 'output');
const work = path.join(root, 'work');
const packet = path.join(work, 'packets', 'chapter-1');
const scaffold = spawnSync(process.execPath, [path.join(__dirname, 'scaffold.js'), output, 'fixture-output', 'Fixture Paper', '测试论文'], { encoding: 'utf8' });
assert.equal(scaffold.status, 0, scaffold.stderr);
assert.equal(fs.existsSync(path.join(output, 'src', 'modules', 'MountainJourney.tsx')), false);
assert.equal(fs.existsSync(path.join(output, 'src', 'modules', 'MountainJourney.css')), false);
assert.equal(fs.existsSync(path.join(output, 'src', 'modules', 'exampleSlider.tsx')), false);
assert.doesNotMatch(fs.readFileSync(path.join(output, 'README.md'), 'utf8'), /登山主题示例|MountainJourney/);
fs.mkdirSync(packet, { recursive: true });
const json = (file, data) => fs.writeFileSync(file, JSON.stringify(data));
fs.mkdirSync(path.join(packet, 'modules'), { recursive: true });
fs.writeFileSync(path.join(packet, 'modules', 'fixture-widget.tsx'), 'export function FixtureWidget() { return null; }\n');
fs.writeFileSync(path.join(packet, 'modules', 'extra-widget.tsx'), 'export function ExtraWidget() { return null; }\n');
json(path.join(work, 'shared.json'), { meta: { titleZh: '测试' }, hero: { oldMethod: { componentId: 'fixture-widget' }, newMethod: { componentId: 'fixture-widget' } } });
json(path.join(packet, 'packet.json'), { chapters: ['chapter.json'], widgets: [
  { componentId: 'fixture-widget', exportName: 'FixtureWidget', file: 'modules/fixture-widget.tsx' },
  { componentId: 'extra-widget', exportName: 'ExtraWidget', file: 'modules/extra-widget.tsx' },
] });
const scene = { id: 'chap-1-observe', title: '观察', goal: '目标', summary: '结论', interaction: '操作', next: '', notes: '讲稿', componentId: 'fixture-widget', moduleId: '1.1' };
const chapter = { kind: 'chapter', id: 'chap-1', title: '章节', modules: [{ kind: 'module', id: '1.1', componentId: 'fixture-widget' }], scenes: [scene] };
function run(data) {
  json(path.join(packet, 'chapter.json'), data);
  const result = spawnSync(process.execPath, [path.join(__dirname, 'assemble-chapter-packets.js'), output, work], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}
assert.equal(run(chapter).status, 0);
const outline = JSON.parse(fs.readFileSync(path.join(output, 'outlines.json'), 'utf8'));
assert.equal(outline.pages[0].snippet, scene.notes);
assert.equal(outline.pages[0].chapterId, chapter.id);
assert.match(fs.readFileSync(path.join(output, 'src/data/tutorial.ts'), 'utf8'), /"scenes"/);
const noActiveModule = run({ ...chapter, modules: [], scenes: [{ ...scene, moduleId: undefined }] });
assert.equal(noActiveModule.status, 1);
assert.match(noActiveModule.stderr, /tutorial needs at least one active module/);
// A real method chapter plus a noninteractive evidence chapter is valid.
json(path.join(packet, 'evidence.json'), { kind: 'chapter', id: 'chap-2', title: '实验结果', modules: [],
  scenes: [{ ...scene, id: 'chap-2-evidence', componentId: 'extra-widget', moduleId: undefined }] });
json(path.join(packet, 'packet.json'), { chapters: ['chapter.json', 'evidence.json'], widgets: [
  { componentId: 'fixture-widget', exportName: 'FixtureWidget', file: 'modules/fixture-widget.tsx' },
  { componentId: 'extra-widget', exportName: 'ExtraWidget', file: 'modules/extra-widget.tsx' },
] });
assert.equal(run(chapter).status, 0, 'evidence chapter should not need cosmetic controls');
json(path.join(packet, 'packet.json'), { chapters: ['chapter.json'], widgets: [
  { componentId: 'fixture-widget', exportName: 'FixtureWidget', file: 'modules/fixture-widget.tsx' },
  { componentId: 'extra-widget', exportName: 'ExtraWidget', file: 'modules/extra-widget.tsx' },
] });
const invalidCases = [
  ['reused scene widget', [scene, { ...scene, id: 'chap-1-repeat', moduleId: undefined }], /scene componentId is reused/],
  ['legacy recap data', [scene], /legacy takeaways field is not rendered/, { takeaways: [] }],
  ['empty scenes', [], /needs explicit scenes/],
  ['duplicate id', [scene, scene], /duplicate scene id/],
  ['reserved id', [{ ...scene, id: 'cover' }], /duplicate scene id/],
  ['unknown module', [{ ...scene, moduleId: 'missing' }], /unknown moduleId/],
  ['missing notes', [{ ...scene, notes: '' }], /notes must be/],
  ['unknown component', [{ ...scene, componentId: 'missing-page' }], /no widget packet/],
  ['legacy intro', [{ ...scene, focus: 'intro' }], /legacy focus body is unsupported/],
  ['legacy recap', [{ ...scene, focus: 'recap' }], /legacy focus body is unsupported/],
  ['legacy formula', [{ ...scene, focus: 'formula' }], /legacy focus body is unsupported/],
  ['missing scene widget', [{ ...scene, componentId: undefined }], /paper-specific scene body/],
  ['unmounted module', [{ ...scene, componentId: 'extra-widget', moduleId: undefined }], /has no teaching scene/],
  ['invalid custom module', [{ ...scene, componentId: 'fixture-widget', moduleId: 'missing' }], /unknown moduleId/],
];
for (const [label, scenes, expected, extra = {}] of invalidCases) {
  const result = run({ ...chapter, ...extra, scenes });
  assert.equal(result.status, 1, label);
  assert.match(result.stderr, expected, label);
}
json(path.join(work, 'shared.json'), { meta: { titleZh: '测试' }, hero: { oldMethod: {}, newMethod: { componentId: 'fixture-widget' } } });
const missingCover = run(chapter);
assert.equal(missingCover.status, 1);
assert.match(missingCover.stderr, /cover animation/);
console.log(`PASS: scene assembly, derived outline, and ${invalidCases.length + 2} invalid packet cases.`);
assert.equal(path.dirname(root), os.tmpdir());
fs.rmSync(root, { recursive: true, force: true });
