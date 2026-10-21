#!/usr/bin/env node
// Stage the demo-free runtime, slide references, and global Markdown guides.
const fs = require('node:fs');
const path = require('node:path');

const targetRoot = process.argv[2] && path.resolve(process.argv[2]);
if (!targetRoot) {
  console.error('Usage: node stage-template.js <temporary-paperSkill-directory>');
  process.exit(2);
}
const source = path.resolve(__dirname, '..', 'assets', 'react-template');
const target = path.join(targetRoot, 'assets', 'react-template');
const gallerySource = path.resolve(__dirname, '..', 'assets', 'layout-gallery');
const galleryTarget = path.join(targetRoot, 'assets', 'layout-gallery');
const skillRoot = path.resolve(__dirname, '..');
const guidesTarget = path.join(targetRoot, 'assets', 'global-guides');
const omitted = new Set([
  'src/data/tutorial.ts', 'src/modules/registry.tsx',
  'src/modules/MountainJourney.tsx', 'src/modules/MountainJourney.css',
]);
fs.cpSync(source, target, {
  recursive: true,
  filter(entry) {
    const relative = path.relative(source, entry).replace(/\\/g, '/');
    return !omitted.has(relative) &&
      !relative.split('/').some(part => ['node_modules', 'dist', '.vite'].includes(part));
  },
});
fs.cpSync(gallerySource, galleryTarget, { recursive: true });
// Keep the runnable teaching demo inspectable without seeding generated runtime content.
const teachingTarget = path.join(galleryTarget, 'teaching-demo');
fs.mkdirSync(teachingTarget, { recursive: true });
for (const relative of ['src/modules/MountainJourney.tsx', 'src/modules/MountainJourney.css',
  'src/data/tutorial.ts']) {
  fs.copyFileSync(path.join(source, relative), path.join(teachingTarget, path.basename(relative)));
}
fs.mkdirSync(guidesTarget, { recursive: true });
for (const name of ['SKILL.md', 'contract.md']) {
  fs.copyFileSync(path.join(skillRoot, name), path.join(guidesTarget, name));
}
fs.cpSync(path.join(skillRoot, 'references'), path.join(guidesTarget, 'references'), { recursive: true });
fs.cpSync(path.join(skillRoot, 'templates'), path.join(guidesTarget, 'templates'), { recursive: true });
const guideScripts = path.join(guidesTarget, 'scripts');
fs.mkdirSync(guideScripts, { recursive: true });
for (const name of fs.readdirSync(path.join(skillRoot, 'scripts')).filter(name => name.endsWith('.md'))) {
  fs.copyFileSync(path.join(skillRoot, 'scripts', name), path.join(guideScripts, name));
}
const readme = path.join(target, 'README.md');
if (fs.existsSync(readme)) {
  const content = fs.readFileSync(readme, 'utf8');
  fs.writeFileSync(readme,
    content.replace(/<!-- DEMO-START -->[\s\S]*?<!-- DEMO-END -->/,
      '此目录是论文专属内容的空白运行框架；请根据当前论文独立选择主题、场景和排版。'));
}
console.log(`Staged demo-free React template, slide gallery, and global guides at ${targetRoot}`);
