import { readFileSync } from 'node:fs';

const text = readFileSync('src/data/tutorial.ts', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const canvas = readFileSync('src/modules/priorzero-canvas.tsx', 'utf8');
const thumbs = readFileSync('src/components/MechanismThumb.tsx', 'utf8');
const css = readFileSync('src/styles/paper.css', 'utf8');
const types = readFileSync('src/types.ts', 'utf8');

const errors = [];
const count = (re) => (text.match(re) || []).length;
const chapters = count(/kind:\s*'chapter'/g);
const modules = count(/kind:\s*'module'/g);

if (chapters !== 10) errors.push(`expected exactly 10 chapters, found ${chapters}`);
if (modules !== 15) errors.push(`expected exactly 15 modules after chapter merge, found ${modules}`);

const videoSurface = [text, app, canvas, types].join('\n');
for (const forbidden of [/bilibili/i, /BiliVideos/, /BV[0-9A-Za-z]+/, /延伸视频/, /推荐视频/]) {
  if (forbidden.test(videoSurface)) errors.push(`video/Bilibili residue found: ${forbidden}`);
}
if (text.includes("id: '11.1'") || canvas.includes("'11.1'") || thumbs.includes("'chap-11'")) errors.push('obsolete chapter 11 residue found');
if ((canvas.match(/focus:\s*'/g) || []).length !== 10) errors.push('expected 10 distinct mechanism thumbnail scenes');
if ((thumbs.match(/'chap-\d+':/g) || []).length !== 10) errors.push('expected 10 mechanism thumbnail mappings');

const requiredTerms = [
  '研究背景',
  '语言模型先验',
  'Root-Prior Injection',
  'MCTS 四阶段',
  'World Model',
  'Value Guidance',
  'Alternating RLFT',
  '训练流程',
  '推理阶段完整流程',
  '实验结果与局限性',
  '总结与术语表',
  '示意值',
];
for (const item of requiredTerms) {
  if (!text.includes(item) && !canvas.includes(item)) errors.push(`missing required learning-path term: ${item}`);
}

const animationTerms = [
  '三节点决策闭环',
  '候选动作概率',
  '根节点注入',
  'Selection：沿 UCB',
  '网格想象轨迹',
  '价值热力图',
  '双环反馈',
  '阶段时间轴',
  '数据沿流程线传递',
  '动态图表',
];
for (const item of animationTerms) {
  if (!canvas.includes(item)) errors.push(`missing redesigned animation concept: ${item}`);
}

for (const word of ['播放', '暂停', '重置', '单步', '速度', '小测验', '正确。', '错误。', '悬停']) {
  if (!canvas.includes(word) && !text.includes(word)) errors.push(`missing interaction affordance: ${word}`);
}

for (const id of ['1.1', '2.1', '3.1', '6.1', '7.1', '7.2', '8.1', '8.2', '8.3', '10.1']) {
  if (!text.includes(`id: '${id}'`)) errors.push(`missing expected module id ${id}`);
  if (!canvas.includes(`'${id}'`)) errors.push(`module ${id} has no canvas spec/drawing branch`);
}

if (!canvas.includes('语言先验权重 α')) errors.push('missing alpha slider');
if (!canvas.includes('MCTS 搜索次数')) errors.push('missing MCTS search-count slider');
if (!canvas.includes('世界模型价值权重')) errors.push('missing world-model value-weight slider');
if (!canvas.includes('prefers-reduced-motion')) errors.push('missing reduced-motion handling');
if (canvas.includes('function hiker') || canvas.includes('drawHiker')) errors.push('stick-figure drawing function still present');
if (!css.includes('aspect-ratio: 1080 / 340')) errors.push('canvas aspect ratio was not updated for redesigned animations');
if (!css.includes('@media (max-width: 768px)')) errors.push('missing mobile responsive CSS');

if (errors.length) {
  console.error('validate-output failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`validate-output passed: ${chapters} chapters, ${modules} modules, redesigned animation checks OK.`);
