#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { checkFiles, formatErrors } = require('./syntax-check.js');

function fail(message) {
  console.error(`Chapter packet assembly failed: ${message}`);
  process.exit(1);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object.`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label} must be a non-empty string.`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array.`);
  }
}

const outputArg = process.argv[2];
const workArg = process.argv[3];
if (!outputArg || !workArg) {
  fail('usage: node assemble-chapter-packets.js <output-directory> <chapter-work-directory>');
}

const outputRoot = path.resolve(outputArg);
const workRoot = path.resolve(workArg);
const dataDir = path.join(outputRoot, 'src', 'data');
const modulesDir = path.join(outputRoot, 'src', 'modules');

for (const [directory, label] of [[outputRoot, 'output'], [workRoot, 'chapter work'], [dataDir, 'output data'], [modulesDir, 'output modules']]) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    fail(`${label} directory does not exist: ${directory}`);
  }
}

const workRootReal = fs.realpathSync(workRoot);

function resolveWorkFile(relativePath, label) {
  requireString(relativePath, label);
  if (path.isAbsolute(relativePath)) {
    fail(`${label} must be relative to the chapter work directory.`);
  }
  const candidate = path.resolve(workRoot, relativePath);
  if (!candidate.startsWith(`${workRoot}${path.sep}`)) {
    fail(`${label} escapes the chapter work directory: ${relativePath}`);
  }
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    fail(`${label} does not exist: ${relativePath}`);
  }
  const real = fs.realpathSync(candidate);
  if (!real.startsWith(`${workRootReal}${path.sep}`)) {
    fail(`${label} resolves outside the chapter work directory: ${relativePath}`);
  }
  return real;
}

const sharedPath = path.join(workRoot, 'shared.json');
if (!fs.existsSync(sharedPath)) {
  fail('shared.json is missing.');
}
const shared = readJson(sharedPath, 'shared.json');
requireObject(shared, 'shared.json');
requireObject(shared.meta, 'shared.meta');
requireObject(shared.hero, 'shared.hero');
if (shared.bilibili !== undefined) {
  requireArray(shared.bilibili, 'shared.bilibili');
}

const packetsRoot = path.join(workRoot, 'packets');
if (!fs.existsSync(packetsRoot) || !fs.statSync(packetsRoot).isDirectory()) {
  fail('packets/ is missing.');
}

const packetDirectories = fs.readdirSync(packetsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'en'));
if (packetDirectories.length === 0) {
  fail('packets/ contains no packet directories.');
}

const chaptersByNumber = new Map();
const sceneComponentIds = new Set();
const moduleIds = new Set();
const sceneIds = new Set(['cover', 'videos']);
const referencedComponents = new Set();
const widgets = new Map();
const exportNames = new Set();
const reservedComponentIds = new Set(['registry']);

function recordComponentId(value, label) {
  if (value === undefined) return;
  requireString(value, label);
  referencedComponents.add(value);
}

for (const side of ['oldMethod', 'newMethod']) {
  requireObject(shared.hero[side], `shared.hero.${side}`);
  requireString(shared.hero[side].componentId, `shared.hero.${side}.componentId (cover animation)`);
  recordComponentId(shared.hero[side].componentId, `shared.hero.${side}.componentId`);
}

for (const packetName of packetDirectories) {
  const packetRelative = path.join('packets', packetName, 'packet.json');
  const packet = readJson(resolveWorkFile(packetRelative, `${packetName} packet`), `${packetName}/packet.json`);
  requireObject(packet, `${packetName} packet`);
  requireArray(packet.chapters, `${packetName}.chapters`);
  requireArray(packet.widgets, `${packetName}.widgets`);

  for (const chapterRelative of packet.chapters) {
    const chapterPath = resolveWorkFile(path.join('packets', packetName, chapterRelative), `${packetName} chapter`);
    const chapter = readJson(chapterPath, chapterRelative);
    requireObject(chapter, chapterRelative);
    if (chapter.kind !== 'chapter') fail(`${chapterRelative}.kind must be chapter.`);
    for (const legacyField of ['badge', 'badgeLabel', 'bridge', 'analogy', 'insight', 'formula', 'takeaways']) {
      if (chapter[legacyField] !== undefined) fail(`${chapterRelative}: legacy ${legacyField} field is not rendered; put its teaching content in scenes.`);
    }
    const chapterMatch = /^chap-([1-9][0-9]*)$/.exec(chapter.id);
    if (!chapterMatch) fail(`${chapterRelative}.id must match chap-N.`);
    const chapterNumber = Number(chapterMatch[1]);
    if (chaptersByNumber.has(chapterNumber)) fail(`chapter ${chapterNumber} is duplicated.`);
    requireArray(chapter.modules, `${chapterRelative}.modules`);
    requireArray(chapter.scenes, `${chapterRelative}.scenes`);
    if (chapter.scenes.length === 0) fail(`${chapterRelative} needs explicit scenes.`);
    for (const scene of chapter.scenes) {
      requireObject(scene, `${chapterRelative} scene`);
      for (const field of ['id', 'title', 'goal', 'summary', 'interaction', 'notes']) {
        requireString(scene[field], `${chapterRelative} scene.${field}`);
      }
      if (typeof scene.next !== 'string') fail(`${scene.id}.next must be a string.`);
      if (!/^[a-z0-9][a-z0-9.-]*$/.test(scene.id) || sceneIds.has(scene.id)) fail(`invalid or duplicate scene id: ${scene.id}`);
      sceneIds.add(scene.id);
      if (scene.focus !== undefined) fail(`${scene.id}: legacy focus body is unsupported; provide a paper-specific componentId.`);
      requireString(scene.componentId, `${scene.id}.componentId (paper-specific scene body)`);
      if (sceneComponentIds.has(scene.componentId)) fail(`${scene.id}: scene componentId is reused; each page needs a distinct body widget.`);
      sceneComponentIds.add(scene.componentId);
      if (scene.moduleId !== undefined && !chapter.modules.some(module => module.id === scene.moduleId)) fail(`${scene.id}: unknown moduleId.`);
      recordComponentId(scene.componentId, `${scene.id}.componentId`);
    }
    for (const module of chapter.modules) {
      requireObject(module, `${chapterRelative} module`);
      if (module.kind !== 'module') fail(`${chapterRelative} contains a module without kind=module.`);
      requireString(module.id, `${chapterRelative} module id`);
      if (moduleIds.has(module.id)) fail(`module id is duplicated: ${module.id}`);
      moduleIds.add(module.id);
      recordComponentId(module.componentId, `${chapterRelative} module componentId`);
      const visible = chapter.scenes.some(scene =>
        scene.moduleId === module.id || scene.componentId === module.componentId);
      if (!visible) fail(`${chapterRelative}: module ${module.id} has no teaching scene; do not replace live interaction with static slides.`);
    }
    chaptersByNumber.set(chapterNumber, chapter);
  }

  for (const widget of packet.widgets) {
    requireObject(widget, `${packetName} widget`);
    requireString(widget.componentId, `${packetName} widget componentId`);
    requireString(widget.exportName, `${packetName} widget exportName`);
    requireString(widget.file, `${packetName} widget file`);
    if (!/^[a-z][a-z0-9-]*$/.test(widget.componentId)) {
      fail(`invalid widget componentId: ${widget.componentId}`);
    }
    if (reservedComponentIds.has(widget.componentId)) {
      fail(`widget componentId is reserved: ${widget.componentId}`);
    }
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(widget.exportName)) {
      fail(`invalid widget exportName: ${widget.exportName}`);
    }
    if (widgets.has(widget.componentId)) fail(`widget componentId is duplicated: ${widget.componentId}`);
    if (exportNames.has(widget.exportName)) fail(`widget exportName is duplicated: ${widget.exportName}`);
    const widgetPath = resolveWorkFile(path.join('packets', packetName, widget.file), `${packetName} widget file`);
    if (!widgetPath.endsWith('.tsx')) fail(`widget file must end in .tsx: ${widget.file}`);
    const widgetSource = fs.readFileSync(widgetPath, 'utf8');
    const exportPattern = new RegExp(`export\\s+(?:const|function|class)\\s+${widget.exportName}\\b`);
    if (!exportPattern.test(widgetSource)) {
      fail(`${widget.file} does not export ${widget.exportName}.`);
    }
    widgets.set(widget.componentId, { ...widget, sourcePath: widgetPath });
    exportNames.add(widget.exportName);
  }
}

const chapterNumbers = [...chaptersByNumber.keys()].sort((a, b) => a - b);
if (chapterNumbers.length === 0) fail('no chapters were produced.');
if (moduleIds.size === 0) fail('tutorial needs at least one active module; evidence-only chapters are allowed.');
chapterNumbers.forEach((number, index) => {
  if (number !== index + 1) fail(`chapter sequence must be contiguous from 1; found chap-${number}.`);
});

for (const componentId of referencedComponents) {
  if (!widgets.has(componentId)) {
    fail(`componentId has no widget packet: ${componentId}`);
  }
}

const chapters = chapterNumbers.map((number) => chaptersByNumber.get(number));
const tutorial = { meta: shared.meta, hero: shared.hero, chapters };
if (shared.bilibili !== undefined) tutorial.bilibili = shared.bilibili;
if (shared.thumbnails !== undefined) tutorial.thumbnails = shared.thumbnails;

const tutorialSource = [
  "import type { TutorialData } from '../types';",
  '',
  `export const tutorial: TutorialData = ${JSON.stringify(tutorial, null, 2)};`,
  '',
].join('\n');
fs.writeFileSync(path.join(dataDir, 'tutorial.ts'), tutorialSource, 'utf8');
fs.writeFileSync(path.join(outputRoot, 'outlines.json'), JSON.stringify({
  title: shared.meta.titleZh,
  pages: chapters.flatMap(chapter => chapter.scenes.map(scene => ({
    id: scene.id, chapterId: chapter.id, title: scene.title, goal: scene.goal,
    summary: scene.summary, interaction: scene.interaction, next: scene.next, snippet: scene.notes,
  }))),
}, null, 2) + '\n', 'utf8');

const sortedWidgets = [...widgets.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'));
for (const [componentId, widget] of sortedWidgets) {
  fs.copyFileSync(widget.sourcePath, path.join(modulesDir, `${componentId}.tsx`));
}

const registryLines = [
  "import React from 'react';",
  ...sortedWidgets.map(([componentId, widget]) => `import { ${widget.exportName} } from './${componentId}';`),
  '',
  'export interface WidgetProps {',
  '  chapterId: string;',
  '  moduleId: string;',
  '}',
  '',
  'export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};',
  ...sortedWidgets.map(([componentId, widget]) => `widgetRegistry['${componentId}'] = ${widget.exportName};`),
  '',
];
fs.writeFileSync(path.join(modulesDir, 'registry.tsx'), registryLines.join('\n'), 'utf8');

// Syntax gate: the assembly step is the last place a truncated or unbalanced widget file can be
// stopped before it reaches a Pull Request. Parse every assembled source with the project's own
// TypeScript/esbuild (installed by `npm install`) instead of relying on the repository CI build.
const assembledSources = [
  path.join(dataDir, 'tutorial.ts'),
  path.join(modulesDir, 'registry.tsx'),
  ...sortedWidgets.map(([componentId]) => path.join(modulesDir, `${componentId}.tsx`)),
];
const syntaxReport = checkFiles(assembledSources, { projectDir: outputRoot });
if (!syntaxReport.available) {
  console.warn('Syntax check skipped: no TypeScript or esbuild under the output folder.');
  console.warn('Run `npm install` in the output folder and re-run assembly to enable the hard syntax gate.');
} else if (syntaxReport.errors.length > 0) {
  for (const line of formatErrors(syntaxReport.errors, outputRoot)) console.error(line);
  fail(
    `assembled sources have ${syntaxReport.errors.length} syntax error(s) (checked with ${syntaxReport.parser}). `
    + 'A common cause is a truncated widget TSX missing its final brace; fix the packet file and re-run assembly.'
  );
} else {
  console.log(`Syntax check passed (${syntaxReport.parser}) over ${syntaxReport.files} assembled source file(s).`);
}

console.log(`Assembled ${chapters.length} chapters and ${widgets.size} widgets into ${outputRoot}`);
