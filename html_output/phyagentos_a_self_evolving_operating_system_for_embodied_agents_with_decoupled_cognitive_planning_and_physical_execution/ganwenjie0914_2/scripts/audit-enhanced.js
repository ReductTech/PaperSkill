#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const unique = (values) => [...new Set(values)];
const difference = (left, right) => left.filter((value) => !right.includes(value));

let failed = false;
const pass = (message) => console.log(`  ✓ ${message}`);
const fail = (message) => {
  failed = true;
  console.error(`  ✗ ${message}`);
};

const requireFile = (relativePath) => {
  if (exists(relativePath)) pass(`存在 ${relativePath}`);
  else fail(`缺少 ${relativePath}`);
};

console.log(`Enhanced audit: ${root}`);

const required = [
  'README.md',
  'package.json',
  'src/data/tutorial.ts',
  'src/modules/registry.tsx',
  'src/styles/tokens.css',
  'src/styles/components.css',
  'src/styles/paper.css',
];
required.forEach(requireFile);

if (!required.every(exists)) process.exit(1);

const tutorial = read('src/data/tutorial.ts');
const registry = read('src/modules/registry.tsx');
const readme = read('README.md');

const componentIds = unique(
  [...tutorial.matchAll(/componentId\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
);
const registrations = [...registry.matchAll(/widgetRegistry\[['"]([^'"]+)['"]\]\s*=\s*(\w+)/g)].map(
  (match) => ({ id: match[1], component: match[2] })
);
const registeredIds = registrations.map(({ id }) => id);

const missingRegistrations = difference(componentIds, registeredIds);
const unusedRegistrations = difference(registeredIds, componentIds);
if (missingRegistrations.length) fail(`tutorial 未注册组件：${missingRegistrations.join(', ')}`);
else pass(`tutorial 的 ${componentIds.length} 个 componentId 均已注册`);
if (unusedRegistrations.length) fail(`registry 未使用组件：${unusedRegistrations.join(', ')}`);
else pass('registry 不包含未使用组件');

const duplicateRegistrations = registeredIds.filter((id, index) => registeredIds.indexOf(id) !== index);
if (duplicateRegistrations.length) fail(`registry 重复注册：${unique(duplicateRegistrations).join(', ')}`);
else pass('registry componentId 唯一');

const missingModuleFiles = registrations.filter(({ component }) => !exists(`src/modules/${component}.tsx`));
if (missingModuleFiles.length) {
  fail(`注册组件缺少文件：${missingModuleFiles.map(({ component }) => component).join(', ')}`);
} else {
  pass('所有注册组件均有对应模块文件');
}

const readmeMissing = registrations
  .map(({ component }) => component)
  .filter((component) => !readme.includes(`\`${component}\``));
if (readmeMissing.length) fail(`README 缺少模块：${readmeMissing.join(', ')}`);
else pass('README 模块列表与 registry 一致');

const chapterCount = (tutorial.match(/kind\s*:\s*['"]chapter['"]/g) ?? []).length;
const moduleCount = (tutorial.match(/kind\s*:\s*['"]module['"]/g) ?? []).length;
const moduleLists = (tutorial.match(/\n\s+modules\s*:\s*\[/g) ?? []).length;
const takeawayLists = (tutorial.match(/\n\s+takeaways\s*:\s*\[/g) ?? []).length;
if (chapterCount > 0 && moduleLists === chapterCount && takeawayLists === chapterCount) {
  pass(`${chapterCount} 章均包含 modules 与 takeaways`);
} else {
  fail(`章节结构不完整：chapters=${chapterCount}, modules=${moduleLists}, takeaways=${takeawayLists}`);
}
if (moduleCount >= chapterCount) pass(`活动模块数量 ${moduleCount}，覆盖全部章节`);
else fail(`活动模块不足：${moduleCount} 个模块 / ${chapterCount} 章`);

const termsBlock = tutorial.match(/const TERMS[\s\S]*?=\s*\{([\s\S]*?)\r?\n\};\r?\n\r?\n\/\*\*/)?.[1] ?? '';
const declaredTerms = unique(
  [...termsBlock.matchAll(/^\s{2}([a-z][a-z0-9]*):\s*\{/gm)].map((match) => match[1])
);
const usedTerms = unique([...tutorial.matchAll(/term\(['"]([^'"]+)['"]/g)].map((match) => match[1]));
const invalidTerms = difference(usedTerms, declaredTerms);
if (invalidTerms.length) fail(`未定义术语 key：${invalidTerms.join(', ')}`);
else pass(`全部 ${usedTerms.length} 个术语引用有效`);

const sourceFiles = [
  'src/data/tutorial.ts',
  ...fs.readdirSync(path.join(root, 'src/modules'))
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => `src/modules/${name}`),
];
const imageRefs = unique(
  sourceFiles.flatMap((relativePath) =>
    [...read(relativePath).matchAll(/\/images\/([^\s"'`<>]+)/g)].map((match) => match[1])
  )
);
const missingImages = imageRefs.filter((name) => !exists(`public/images/${name}`));
if (missingImages.length) fail(`图片引用不存在：${missingImages.join(', ')}`);
else pass(`全部 ${imageRefs.length} 个图片引用有效`);

const publicImagesDir = path.join(root, 'public/images');
const publicImages = fs.existsSync(publicImagesDir)
  ? fs.readdirSync(publicImagesDir).filter((name) => fs.statSync(path.join(publicImagesDir, name)).isFile())
  : [];
const unreferencedImages = difference(publicImages, imageRefs);
if (unreferencedImages.length) fail(`public/images 存在未引用资源：${unreferencedImages.join(', ')}`);
else pass('public/images 不包含孤立资源');

const urls = [...tutorial.matchAll(/url\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const invalidUrls = urls.filter((value) => {
  try {
    const url = new URL(value);
    return !['http:', 'https:'].includes(url.protocol);
  } catch {
    return true;
  }
});
if (invalidUrls.length) fail(`外部 URL 非法：${invalidUrls.join(', ')}`);
else pass(`全部 ${urls.length} 个外部 URL 合法`);

const forbiddenRootNames = fs.readdirSync(root).filter((name) =>
  /\.log$|\.tmp$|\.bak$|^coverage$|^screenshots?$/i.test(name)
);
if (forbiddenRootNames.length) fail(`发现开发遗留文件：${forbiddenRootNames.join(', ')}`);
else pass('未发现 log、临时文件、测试缓存或调试截图');

console.log('');
if (failed) {
  console.error('RESULT: FAIL');
  process.exit(1);
}
console.log('RESULT: PASS');
