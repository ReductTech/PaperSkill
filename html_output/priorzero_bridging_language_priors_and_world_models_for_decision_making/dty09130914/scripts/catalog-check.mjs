import { readFileSync } from 'node:fs';

const tutorial = readFileSync('src/data/tutorial.ts', 'utf8');
const registry = readFileSync('src/modules/registry.tsx', 'utf8');
const canvas = readFileSync('src/modules/priorzero-canvas.tsx', 'utf8');
const errors = [];

const componentIds = [...tutorial.matchAll(/componentId:\s*'([^']+)'/g)].map((m) => m[1]);
const uniqueComponents = [...new Set(componentIds)];
for (const id of uniqueComponents) {
  if (!registry.includes(`widgetRegistry['${id}']`) && !registry.includes(`widgetRegistry[\"${id}\"]`)) {
    errors.push(`componentId ${id} is not registered`);
  }
}

const moduleIds = [...tutorial.matchAll(/id:\s*'([0-9]+\.[0-9]+)'/g)].map((m) => m[1]);
for (const id of moduleIds) {
  if (!canvas.includes(`'${id}'`)) errors.push(`module ${id} has no canvas spec/drawing branch`);
}

const expected = ['1.1', '1.2', '2.1', '3.1', '4.1', '5.1', '6.1', '7.1', '7.2', '8.1', '8.2', '8.3', '9.1', '10.1', '10.2'];
for (const id of expected) {
  if (!moduleIds.includes(id)) errors.push(`expected module ${id} missing from tutorial catalog`);
}
if (moduleIds.includes('11.1')) errors.push('obsolete module 11.1 should not remain after chapter merge');

const requiredControls = ['播放', '暂停', '重置', '单步', '速度', '当前步骤'];
for (const label of requiredControls) {
  if (!canvas.includes(label)) errors.push(`control label missing: ${label}`);
}

if (/bilibili|BV[0-9A-Za-z]+|延伸视频|推荐视频/i.test(tutorial)) errors.push('video recommendation data should be absent');
if (!tutorial.includes('0.82 vs 0.79')) errors.push('reported BabyAI comparison missing');
if (!tutorial.includes('0.995') || !tutorial.includes('0.960')) errors.push('reported FindObjS7 boundary comparison missing');
if (!canvas.includes('hitTest')) errors.push('canvas interactions are not wired for clicking/hovering');

if (errors.length) {
  console.error('catalog check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`catalog check passed: ${moduleIds.length} module entries use ${uniqueComponents.join(', ')}.`);
