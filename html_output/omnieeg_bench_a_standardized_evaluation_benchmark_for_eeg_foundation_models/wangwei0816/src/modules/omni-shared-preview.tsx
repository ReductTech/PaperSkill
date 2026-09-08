import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const P = {
  bg: '#f7f9fc', panel: '#ffffff', grid: '#e7ebf1', line: '#cbd4df',
  ink: '#17263b', muted: '#617187', blue: '#245d87', cyan: '#118a95',
  green: '#27815f', red: '#bd4051', amber: '#c47719', purple: '#6756a3',
  train: '#245d87', val: '#c47719', test: '#27815f',
};

type Lab = {
  label: string;
  options: string[];
  metric: (index: number, value: number) => string;
  feedback: (index: number, value: number) => string;
  tone?: (index: number, value: number) => 'good' | 'bad' | 'neutral';
  valueLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  initial?: number;
};

const labs: Record<number, Lab> = {
  1: {
    label: '控制变量：评测口径',
    options: ['全部一致', '更换数据集', '更换受试者切分', '更换评价指标'],
    metric: (i) => i === 0 ? '模型差异可解释' : ['', '数据分布进入差值', '身份信息进入差值', '量纲与方向进入差值'][i],
    feedback: (i) => i === 0 ? '数据、切分、指标同时固定，柱高才指向模型能力。' : '当前对比混入实验设置差异，分数不能直接排成同一榜单。',
    tone: (i) => i === 0 ? 'good' : 'bad',
  },
  2: {
    label: '标准化栈',
    options: ['原始论文', '任务卡', '模型接口', '评测协议'],
    metric: (i) => ['口径分散', '任务定义固定', '输入输出固定', '可复现比较闭环'][i],
    feedback: (i) => ['每篇工作仍在自己的数据、接口和切分上报告结果。', '预处理、窗口、标签和指标已经写入任务契约。', '十种骨干接入同一输入—表示—预测接口。', '任务、接口、切分与重复次数共同确定一个可复现分数。'][i],
    tone: (i) => i === 3 ? 'good' : 'neutral',
  },
  3: {
    label: 'EEG 能力地图',
    options: ['信号可靠性', '生物特征与疾病', '意识与状态', '认知与情绪', '自然刺激解码', '运动与交互'],
    metric: (i) => ['伪迹与跨会话稳定性', '稳定个体特征', '慢—中速脑状态', '中速认知情感', '快速真实刺激', '主动闭环控制'][i],
    feedback: (i) => i === 4 ? '自然刺激同时具有快速变化和开放环境噪声，是当前模型的困难区域。' : '六类任务沿时间尺度、主动程度与特质—状态三条轴互补覆盖。',
  },
  4: {
    label: '任务卡解剖',
    options: ['预处理', '输入窗口', '目标标签', '评价指标'],
    metric: (i) => ['降采样 · 滤波 · CAR · 分窗', 'x ∈ R^(C×T)', '分类或回归目标', '任务指定 · 方向明确'][i],
    feedback: (i) => ['共同预处理压缩实现差异，同时保留数据集本身的生理差异。', '窗口长度与通道数定义模型实际看到的信号。', '标签语义和类别空间决定预测问题。', '指标名称、单位和优劣方向共同约束结果解释。'][i],
  },
  5: {
    label: '适配方式',
    options: ['线性探测', '全量微调'],
    valueLabel: '训练进度（机制示意）', min: 0, max: 100, step: 1, initial: 0,
    metric: (i, v) => v === 0 ? '初始化' : v < 100 ? `${v}%` : i === 0 ? '只得到最优线性读出' : '表示与读出共同适配',
    feedback: (i, v) => i === 0
      ? (v === 0 ? '表示 z 与骨干 fθ 已冻结；训练只会改变任务头 g。' : v < 100 ? '点云保持不动，g 的分类边界正在收敛。' : '只有 g 收敛：线性探测读取冻结表示的可分性。')
      : (v === 0 ? '骨干 fθ 与任务头 g 均可更新，任务梯度会进入骨干。' : v < 100 ? '表示点云与 g 的分类边界正在共同移动。' : 'z 与 g 共同收敛：全量微调同时包含表示适配能力。'),
    tone: (i, v) => v === 100 && i === 0 ? 'good' : 'neutral',
  },
  6: {
    label: '四种评测协议',
    options: ['跨受试者', '多受试者', '零/小样本', '通道遮蔽'],
    metric: (i) => ['受试者 8:1:1', '每人试次 8:1:1', 'k = 0/2/5/10/30%', 'p = 20/40/60/80%'][i],
    feedback: (i) => ['训练、验证、测试身份互斥，主榜据此检验陌生个体迁移。', '每名受试者内部按试次切分后汇总，同一身份会跨集合出现。', '沿用跨受试者切分，只下采样训练集中每类带标签样本；验证与测试集合不变。', '沿用跨受试者切分和线性探测；每个样本随机选择完整通道置零，固定随机种子供所有模型复用。'][i],
    tone: (i) => i === 0 ? 'good' : 'neutral',
  },
  7: {
    label: '切分边界',
    options: ['按受试者切分', '按试次切分'],
    metric: (i) => i === 0 ? '测试身份完全隔离' : '测试身份已在训练集出现',
    feedback: (i) => i === 0 ? '测试身份从未参与训练，平均名次反映跨个体迁移。' : '测试身份已经参与训练。这是另一种有效协议，但结论范围限于已见人群的新试次。',
    tone: (i) => i === 0 ? 'good' : 'neutral',
  },
  8: {
    label: '压力测试',
    options: ['小样本', '通道遮蔽'],
    valueLabel: '强度', min: 0, max: 4, step: 1, initial: 0,
    metric: (i, v) => i === 0 ? ['k = 0', 'k = 2%', 'k = 5%', 'k = 10%', 'k = 30%'][v] : ['p = 0', 'p = 20%', 'p = 40%', 'p = 60%', 'p = 80%'][v],
    feedback: (i, v) => i === 0 ? (v === 0 ? '零样本使用验证集最近邻余弦相似度，不训练分类头。' : v <= 2 ? '极少标签主要检验表示空间是否已形成可读的类别邻域。' : '标签预算逐级增至 30%，用于比较低标签条件下的适应变化。') : (v === 0 ? '未遮蔽基线保留全部 EEG 通道。' : v <= 2 ? '20%–40% 遮蔽下 BIOT 相对稳定，模型差距仍可观察。' : '60%–80% 通道缺失时，多数模型接近机会水平。'),
    tone: (i, v) => i === 1 && v >= 3 ? 'bad' : 'neutral',
  },
  9: {
    label: '测量框架对齐实验',
    options: ['各自口径', 'OmniEEG-Bench'],
    metric: (i) => i === 0 ? '框架错位：分数同时含有模型差与设置差' : '框架锁定：在同一任务与协议下比较表示',
    feedback: (i) => i === 0
      ? '观察三列的红色错位：输入定义、切分或指标方向不一致时，分数差无法单独归因于骨干能力。'
      : '上下两条绿色测量夹具固定任务卡与评测协议；骨干结构和表示维度 dᵢ 仍可不同，模型专属线性头 gᵢ 只做维度适配并遵循同一训练规则。',
    tone: (i) => i === 0 ? 'bad' : 'good',
  },
  10: {
    label: '关键数据浏览器',
    options: ['基准规模', '线性探测', '全量微调', '通道遮蔽', 'Scaling 关联'],
    metric: (i) => [
      '54 数据集 · 58 任务 · 6 类能力 · 4 种协议 · 10 个模型',
      '第 1 BrainOmni · 第 2 CBraMod · 第 3 REVE',
      'CBraMod 4.51 · LaBraM 4.88 · FEMBA 5.42（名次越低越好）',
      '20%–40%：BIOT 相对稳定；60%–80%：多数模型接近机会水平',
      '数据集数 ρ = −0.27（p = 1.1×10⁻⁷）；参数量 ρ = −0.21（p = 7.0×10⁻⁴）'
    ][i],
    feedback: (i) => [
      '这五个数字定义了 benchmark 的覆盖面：数据、任务、能力、协议与被测模型数量。',
      '论文明确报告前三顺序，没有给出三者可直接比较的平均名次数值，因此用序位图呈现。',
      '允许骨干更新后，前三变为 CBraMod、LaBraM、FEMBA；横轴保留论文报告的平均名次。',
      '这是区间证据，不把遮蔽强度转换成未经报告的性能百分数。',
      '两项负相关都通过 Wilcoxon 检验；它们与“更低的平均名次”方向一致，仍属于关联证据。'
    ][i],
    tone: (i) => i <= 1 ? 'good' : 'neutral',
  },
  11: {
    label: '结论证据边界',
    options: ['论文事实', '条件化结论', '越界推断'],
    metric: (i) => ['54 数据集 · 58 任务 · 10 模型', '协议 + 数据集 + 指标方向', '相关不提供因果证据'][i],
    feedback: (i) => ['这些数字由 benchmark 的设计与实验直接报告。', '排名、鲁棒性与迁移结论都需要附带评测条件。', '“规模导致性能提升”和“一个模型统治所有任务”均超出当前证据。'][i],
    tone: (i) => i === 0 ? 'good' : i === 2 ? 'bad' : 'neutral',
  },
};

type Ctx = CanvasRenderingContext2D;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r = 8) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function panel(ctx: Ctx, x: number, y: number, w: number, h: number, title?: string) {
  ctx.fillStyle = P.panel; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = P.line; ctx.lineWidth = 1; rr(ctx, x, y, w, h, 7); ctx.stroke();
  if (title) label(ctx, title, x + 12, y + 18, P.muted, 11, 600);
}

function label(ctx: Ctx, text: string, x: number, y: number, color = P.ink, size = 12, weight = 600, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px system-ui`; ctx.textAlign = align; ctx.fillText(text, x, y);
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color = P.line, width = 1, dash: number[] = []) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
}

function dot(ctx: Ctx, x: number, y: number, r: number, color: string, stroke = '#fff') {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function pill(ctx: Ctx, text: string, x: number, y: number, color: string, active = false, width = 72) {
  ctx.fillStyle = active ? color : '#eef2f7'; rr(ctx, x, y, width, 24, 12); ctx.fill();
  label(ctx, text, x + width / 2, y + 16, active ? '#fff' : P.muted, 11, 700, 'center');
}

function arrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color = P.blue) {
  line(ctx, x1, y1, x2, y2, color, 2); const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7 * Math.cos(a - .45), y2 - 7 * Math.sin(a - .45)); ctx.lineTo(x2 - 7 * Math.cos(a + .45), y2 - 7 * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
}

function gridBg(ctx: Ctx) {
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, 640, 300); ctx.strokeStyle = P.grid; ctx.lineWidth = .7;
  for (let x = 0; x <= 640; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke(); }
  for (let y = 0; y <= 300; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
}

function waveform(ctx: Ctx, x: number, y: number, w: number, amp: number, phase: number, color = P.blue, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.7; ctx.beginPath();
  for (let i = 0; i <= w; i += 2) { const yy = y + Math.sin(i * .13 + phase) * amp * .58 + Math.sin(i * .047 + phase * .6) * amp * .42; if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy); }
  ctx.stroke(); ctx.globalAlpha = 1;
}

function drawComparability(ctx: Ctx, selected: number, t: number) {
  panel(ctx, 20, 28, 286, 230, '论文 A'); panel(ctx, 334, 28, 286, 230, '论文 B'); const mismatch = selected > 0;
  const maxA = 100; const maxB = selected === 1 ? 70 : selected === 3 ? 1 : 100;
  label(ctx, `量程 0—${maxA}`, 38, 55, P.muted, 10); label(ctx, `量程 0—${maxB}`, 352, 55, mismatch ? P.red : P.muted, 10);
  const valsA = [72, 58, 44]; const valsB = selected === 1 ? [54, 60, 48] : [68, 61, 48]; const colors = [P.blue, P.cyan, P.purple];
  [0, 1].forEach((side) => { const ox = side ? 352 : 38; const vals = side ? valsB : valsA; line(ctx, ox, 211, ox + 248, 211, P.line, 1.4); vals.forEach((v, i) => { const displayed = side && selected === 3 ? v / 100 : v; const scale = side ? maxB : maxA; const h = Math.min(125, displayed / scale * 125); ctx.fillStyle = colors[i]; ctx.fillRect(ox + 32 + i * 72, 211 - h, 30, h); label(ctx, side && selected === 3 ? displayed.toFixed(2) : String(v), ox + 47 + i * 72, 226, P.muted, 10, 600, 'center'); }); });
  if (selected === 2) { ctx.fillStyle = 'rgba(189,64,81,.09)'; ctx.fillRect(334, 28, 286, 230); label(ctx, '测试身份曾出现在训练集', 477, 247, P.red, 11, 700, 'center'); }
  else label(ctx, mismatch ? '同一柱高已含额外变量' : '同量程 · 同切分 · 同指标', 320, 282, mismatch ? P.red : P.green, 12, 700, 'center');
  if (!mismatch) label(ctx, '✓', 603, 55, P.green, 13, 800, 'center');
}

function drawStack(ctx: Ctx, selected: number, t: number) {
  const layers = [['任务卡', '预处理 · 窗口 · 标签 · 指标'], ['模型接口', 'x → fθ(x) → z → g(z)'], ['评测协议', '切分 · 样本量 · 遮蔽 · 重复']];
  panel(ctx, 22, 26, 596, 232, '从异构结果到共同坐标');
  for (let i = 0; i < 5; i++) waveform(ctx, 42, 72 + i * 29, 95, 5, t / 750 + i, [P.blue, P.cyan, P.purple, P.amber, P.red][i]);
  label(ctx, '54 数据集', 89, 226, P.muted, 11, 700, 'center');
  layers.forEach((item, i) => { const x = 169 + i * 132; const active = selected >= i + 1; ctx.fillStyle = active ? '#e5f2f1' : '#f0f3f7'; rr(ctx, x, 73, 112, 113, 6); ctx.fill(); ctx.strokeStyle = active ? P.cyan : P.line; ctx.lineWidth = active ? 2 : 1; rr(ctx, x, 73, 112, 113, 6); ctx.stroke(); label(ctx, item[0], x + 56, 102, active ? P.ink : P.muted, 13, 800, 'center'); item[1].split(' · ').forEach((s, n) => label(ctx, s, x + 56, 126 + n * 18, active ? P.muted : '#9aa6b5', 10, 600, 'center')); if (i < 2) arrow(ctx, x + 115, 129, x + 129, 129, active ? P.cyan : P.line); });
  const confidence = [18, 46, 72, 100][selected]; label(ctx, '可比性', 169, 218, P.muted, 10); ctx.fillStyle = '#e8edf3'; rr(ctx, 218, 209, 344, 12, 6); ctx.fill(); ctx.fillStyle = selected === 3 ? P.green : P.blue; rr(ctx, 218, 209, 344 * confidence / 100, 12, 6); ctx.fill(); label(ctx, `${confidence}%`, 578, 219, selected === 3 ? P.green : P.blue, 11, 800, 'right');
}

function drawAtlas(ctx: Ctx, selected: number) {
  panel(ctx, 24, 24, 592, 238, '六类能力沿三条连续维度展开'); const x0 = 86, y0 = 218, w = 474, h = 150;
  arrow(ctx, x0, y0, x0 + w, y0, P.muted); arrow(ctx, x0, y0, x0, y0 - h, P.muted); label(ctx, '被动', x0, 241, P.muted, 10, 600, 'center'); label(ctx, '主动', x0 + w, 241, P.muted, 10, 600, 'center'); label(ctx, '状态 / 快', 43, 76, P.muted, 10, 600, 'center'); label(ctx, '特质 / 慢', 43, 220, P.muted, 10, 600, 'center'); line(ctx, x0, 142, x0 + w, 142, P.line, 1, [4, 4]);
  const pts: Array<[number, number, string]> = [[130, 193, '可靠性'], [180, 178, '疾病'], [260, 115, '状态'], [344, 132, '认知'], [438, 82, '自然刺激'], [522, 166, '运动']];
  pts.forEach(([x, y, name], i) => { const active = i === selected; if (active) { ctx.fillStyle = 'rgba(17,138,149,.12)'; ctx.beginPath(); ctx.arc(x, y, 27, 0, Math.PI * 2); ctx.fill(); } dot(ctx, x, y, active ? 10 : 7, active ? P.cyan : P.blue); label(ctx, name, x, y - 15, active ? P.ink : P.muted, active ? 11 : 10, active ? 800 : 600, 'center'); });
  pill(ctx, '第三轴：特质 ↔ 状态', 414, 35, P.purple, true, 176);
}

function drawTaskCard(ctx: Ctx, selected: number, t: number) {
  panel(ctx, 20, 24, 600, 238, '一张任务卡固定一次实验的完整语义'); const names = ['预处理', '输入窗口', '目标标签', '评价指标']; const detail = ['Filter · CAR · Window', 'C × T', 'y / 类别空间', 'Metric ↑↓'];
  names.forEach((name, i) => { const x = 38 + i * 144; const active = selected === i; ctx.fillStyle = active ? '#e5f2f1' : '#f3f5f8'; rr(ctx, x, 75, 124, 112, 6); ctx.fill(); ctx.strokeStyle = active ? P.cyan : P.line; ctx.lineWidth = active ? 2.5 : 1; rr(ctx, x, 75, 124, 112, 6); ctx.stroke(); label(ctx, `0${i + 1}`, x + 15, 97, active ? P.cyan : '#9ba7b4', 11, 800); label(ctx, name, x + 62, 128, active ? P.ink : P.muted, 13, 800, 'center'); label(ctx, detail[i], x + 62, 153, active ? P.cyan : P.muted, 10, 700, 'center'); if (i < 3) arrow(ctx, x + 126, 131, x + 141, 131, active ? P.cyan : P.line); });
  waveform(ctx, 39, 218, 545, 8, t / 650, P.blue); const cursorX = 39 + ((t / 18) % 545); line(ctx, cursorX, 202, cursorX, 233, P.amber, 2); label(ctx, '同一任务可被另一实现重复执行', 320, 252, P.green, 11, 700, 'center');
}

function drawAdaptationMobile(ctx: Ctx, selected: number, value: number, t: number) {
  const progress = Math.max(0, Math.min(1, value / 100));
  const eased = progress * progress * (3 - 2 * progress);
  const plotX = 32, plotY = 58, plotW = 296, plotH = 142;
  panel(ctx, 16, 16, 328, 220);
  label(ctx, selected === 0 ? '固定表示 z，只训练线性头 g' : '表示 z 与线性头 g 共同更新', 30, 42, P.ink, 11, 800);
  ctx.fillStyle = '#fbfcfe'; ctx.fillRect(plotX, plotY, plotW, plotH);
  ctx.strokeStyle = P.line; ctx.lineWidth = 1; ctx.strokeRect(plotX, plotY, plotW, plotH);
  label(ctx, 'z₂', plotX - 6, plotY + 8, P.muted, 9, 600, 'right');
  label(ctx, '表示维度 z₁', plotX + plotW, plotY + plotH + 14, P.muted, 9, 600, 'right');

  const classA: Array<[number, number]> = [[103, 181], [128, 139], [153, 197], [177, 159], [202, 119], [225, 178], [249, 147]];
  const classB: Array<[number, number]> = [[202, 194], [234, 158], [261, 128], [286, 179], [314, 139], [341, 105], [365, 163]];
  const place = (point: [number, number], kind: number): [number, number] => {
    const baseX = plotX + (point[0] - 45) / 382 * plotW;
    const baseY = plotY + (point[1] - 61) / 170 * plotH;
    if (selected === 0) return [baseX, baseY];
    return [baseX + (kind === 0 ? -26 : 26) * eased, baseY + (kind === 0 ? 10 : -10) * eased];
  };
  [classA, classB].forEach((points, kind) => points.forEach((point) => {
    const base: [number, number] = [plotX + (point[0] - 45) / 382 * plotW, plotY + (point[1] - 61) / 170 * plotH];
    const current = place(point, kind);
    if (selected === 1 && progress > .02) line(ctx, base[0], base[1], current[0], current[1], kind === 0 ? 'rgba(36,93,135,.24)' : 'rgba(103,86,163,.24)', 1, [2, 3]);
    dot(ctx, current[0], current[1], 4.5, kind === 0 ? P.blue : P.purple);
  }));

  const boundaryAngle = -.28 + eased * .88;
  const cx = plotX + (235 - 45) / 382 * plotW, cy = plotY + (151 - 61) / 170 * plotH;
  const length = 94;
  line(ctx, cx - Math.cos(boundaryAngle) * length, cy - Math.sin(boundaryAngle) * length, cx + Math.cos(boundaryAngle) * length, cy + Math.sin(boundaryAngle) * length, P.amber, 3);
  const pulse = .5 + .5 * Math.sin(t / 360);
  if (progress > 0 && progress < 1) dot(ctx, cx + Math.cos(boundaryAngle) * (28 + pulse * 18), cy + Math.sin(boundaryAngle) * (28 + pulse * 18), 3.5, P.amber);
  dot(ctx, 34, 222, 4.5, P.blue); label(ctx, 'A', 44, 226, P.muted, 9, 700);
  dot(ctx, 70, 222, 4.5, P.purple); label(ctx, 'B', 80, 226, P.muted, 9, 700);
  line(ctx, 103, 222, 131, 222, P.amber, 3); label(ctx, 'g 的边界', 139, 226, P.muted, 9, 700);

  panel(ctx, 16, 250, 328, 140, '参数是否更新');
  const rows = selected === 0
    ? [['骨干 fθ', '冻结', P.muted], ['表示 z', '位置固定', P.blue], ['线性头 g', '更新', P.amber]]
    : [['骨干 fθ', '更新', P.red], ['表示 zθ', '随任务移动', P.purple], ['线性头 g', '更新', P.amber]];
  rows.forEach(([name, state, color], i) => {
    const y = 286 + i * 33;
    label(ctx, name, 32, y, P.muted, 10, 700);
    label(ctx, state, 328, y, color, 10, 800, 'right');
    ctx.fillStyle = '#e9eef3'; rr(ctx, 100, y - 7, 174, 6, 3); ctx.fill();
    ctx.fillStyle = color; rr(ctx, 100, y - 7, 174 * (name === '骨干 fθ' && selected === 0 ? 0 : Math.max(.05, eased)), 6, 3); ctx.fill();
  });
  label(ctx, selected === 0 ? '读取冻结表示的可分性' : '同时包含表示适配能力', 180, 410, selected === 0 ? P.green : P.purple, 10, 800, 'center');
}

function drawAdaptation(ctx: Ctx, selected: number, value: number, t: number, mobile = false) {
  if (mobile) { drawAdaptationMobile(ctx, selected, value, t); return; }
  const progress = Math.max(0, Math.min(1, value / 100));
  const eased = progress * progress * (3 - 2 * progress);
  const px = 28, py = 28, pw = 400, ph = 226;
  panel(ctx, px, py, pw, ph);
  label(ctx, selected === 0 ? '固定表示 z，只训练线性头 g' : '表示 z 与线性头 g 共同更新', px + 16, py + 22, P.ink, 11, 800);

  const plotX = px + 20, plotY = py + 38, plotW = 360, plotH = 145;
  ctx.fillStyle = '#fbfcfe'; ctx.fillRect(plotX, plotY, plotW, plotH);
  ctx.strokeStyle = P.line; ctx.lineWidth = 1; ctx.strokeRect(plotX, plotY, plotW, plotH);
  label(ctx, '表示维度 z₁', plotX + plotW, plotY + plotH + 16, P.muted, 9, 600, 'right');
  label(ctx, 'z₂', plotX - 7, plotY + 8, P.muted, 9, 600, 'right');

  const classA: Array<[number, number]> = [[103, 181], [128, 139], [153, 197], [177, 159], [202, 119], [225, 178], [249, 147]];
  const classB: Array<[number, number]> = [[202, 194], [234, 158], [261, 128], [286, 179], [314, 139], [341, 105], [365, 163]];
  const move = (point: [number, number], kind: number): [number, number] => {
    if (selected === 0) return point;
    const dx = kind === 0 ? -34 : 34;
    const dy = kind === 0 ? 12 : -12;
    return [point[0] + dx * eased, point[1] + dy * eased];
  };
  [classA, classB].forEach((points, kind) => points.forEach((point) => {
    const current = move(point, kind);
    if (selected === 1 && progress > .02) line(ctx, point[0], point[1], current[0], current[1], kind === 0 ? 'rgba(36,93,135,.24)' : 'rgba(103,86,163,.24)', 1, [2, 3]);
    dot(ctx, current[0], current[1], 5.5, kind === 0 ? P.blue : P.purple);
  }));

  const boundaryAngle = -.28 + eased * .88;
  const cx = 235 + (selected === 1 ? eased * 2 : 0), cy = 151;
  const length = 122;
  line(ctx, cx - Math.cos(boundaryAngle) * length, cy - Math.sin(boundaryAngle) * length, cx + Math.cos(boundaryAngle) * length, cy + Math.sin(boundaryAngle) * length, P.amber, 3);
  const pulse = .5 + .5 * Math.sin(t / 360);
  if (progress > 0 && progress < 1) dot(ctx, cx + Math.cos(boundaryAngle) * (34 + pulse * 24), cy + Math.sin(boundaryAngle) * (34 + pulse * 24), 4, P.amber);

  dot(ctx, 50, 239, 5, P.blue); label(ctx, '类别 A', 61, 243, P.muted, 10, 700);
  dot(ctx, 122, 239, 5, P.purple); label(ctx, '类别 B', 133, 243, P.muted, 10, 700);
  line(ctx, 198, 239, 230, 239, P.amber, 3); label(ctx, 'g 的分类边界', 239, 243, P.muted, 10, 700);

  panel(ctx, 447, 28, 165, 226, '参数是否更新');
  const rows = selected === 0
    ? [['骨干 fθ', '冻结', P.muted], ['表示 z', '位置固定', P.blue], ['线性头 g', '更新', P.amber]]
    : [['骨干 fθ', '更新', P.red], ['表示 zθ', '随任务移动', P.purple], ['线性头 g', '更新', P.amber]];
  rows.forEach(([name, state, color], i) => {
    const y = 72 + i * 48;
    label(ctx, name, 461, y, P.muted, 10, 700);
    label(ctx, state, 598, y, color, 11, 800, 'right');
    ctx.fillStyle = '#e9eef3'; rr(ctx, 461, y + 11, 137, 6, 3); ctx.fill();
    ctx.fillStyle = color; rr(ctx, 461, y + 11, 137 * (name === '骨干 fθ' && selected === 0 ? 0 : Math.max(.05, eased)), 6, 3); ctx.fill();
  });
  label(ctx, selected === 0 ? '测冻结表示的可读性' : '测表示与任务适配', 529, 231, selected === 0 ? P.green : P.purple, 10, 800, 'center');
  label(ctx, '点位仅作机制示意', 320, 280, P.muted, 9, 600, 'center');
}

function drawProtocol(ctx: Ctx, selected: number) {
  const legend = (items: Array<[string, string]>, x = 474, y = 82) => items.forEach(([color, name], i) => {
    ctx.fillStyle = color; rr(ctx, x, y + i * 31, 18, 18, 3); ctx.fill(); label(ctx, name, x + 28, y + 14 + i * 31, P.muted, 10);
  });

  if (selected <= 1) {
    const crossSubject = selected === 0;
    panel(ctx, 20, 24, 600, 238, crossSubject ? '切分单位：受试者（行）' : '切分单位：每名受试者内部的试次（格）');
    const x0 = 68, y0 = 70, cw = 39, ch = 24;
    for (let r = 0; r < 6; r++) {
      label(ctx, `S${r + 1}`, 53, y0 + r * 29 + 17, P.muted, 10, 700, 'right');
      for (let c = 0; c < 8; c++) {
        const color = crossSubject
          ? (r < 4 ? P.train : r === 4 ? P.val : P.test)
          : (c < 6 ? P.train : c === 6 ? P.val : P.test);
        ctx.fillStyle = color; rr(ctx, x0 + c * 43, y0 + r * 29, cw, ch, 3); ctx.fill();
      }
    }
    legend([[P.train, '训练'], [P.val, '验证'], [P.test, '测试']]);
    label(ctx, crossSubject ? '一整行只属于一个集合' : '每一行都横跨三个集合', 520, 205, crossSubject ? P.green : P.amber, 11, 800, 'center');
    label(ctx, crossSubject ? '测试：从未见过的身份' : '测试：已见身份的新试次', 320, 282, crossSubject ? P.green : P.amber, 12, 800, 'center');
    return;
  }

  if (selected === 2) {
    panel(ctx, 20, 24, 600, 238, '切分仍按受试者；只下采样训练集中的每类标签');
    const budgets = ['0', '2%', '5%', '10%', '30%'];
    budgets.forEach((budget, col) => {
      const x = 54 + col * 82;
      label(ctx, `k=${budget}`, x + 24, 68, P.muted, 9, 700, 'center');
      for (let row = 0; row < 7; row++) {
        const filled = budget === '0' ? 0 : Math.max(1, col + 1);
        dot(ctx, x + 24, 91 + row * 18, 5, row < filled ? P.amber : '#dce4eb', '#fff');
      }
    });
    line(ctx, 468, 72, 468, 218, P.line, 1);
    pill(ctx, '验证集', 492, 80, P.blue, true, 92);
    label(ctx, '标签始终保留', 538, 122, P.blue, 10, 700, 'center');
    pill(ctx, '测试集', 492, 148, P.green, true, 92);
    label(ctx, '身份与样本不变', 538, 190, P.green, 10, 700, 'center');
    label(ctx, '点阵表示训练标签预算，不表示性能', 248, 244, P.muted, 9, 600, 'center');
    label(ctx, '改变：训练监督量　保持：受试者边界、验证集、测试集', 320, 282, P.amber, 11, 800, 'center');
    return;
  }

  panel(ctx, 20, 24, 600, 238, '切分与标签预算不变；随机选择完整 EEG 通道置零');
  const x0 = 88, y0 = 64, w = 348;
  for (let row = 0; row < 7; row++) {
    const y = y0 + row * 25;
    const masked = row === 1 || row === 4 || row === 6;
    label(ctx, `Ch ${row + 1}`, 72, y + 3, P.muted, 9, 700, 'right');
    line(ctx, x0, y, x0 + w, y, '#e5ebf0', 1);
    if (masked) line(ctx, x0, y, x0 + w, y, P.red, 2.5);
    else waveform(ctx, x0, y, w, 8, row * .7, P.blue, .9);
  }
  legend([[P.blue, '保留波形'], [P.red, '整通道置零']], 484, 89);
  label(ctx, '同一样本的 C×T 形状不变', 536, 179, P.muted, 10, 700, 'center');
  label(ctx, '改变：通道可见性　保持：划分、标签与训练规则', 320, 282, P.red, 11, 800, 'center');
}

function drawBoundary(ctx: Ctx, selected: number, t: number) {
  const titles = ['按受试者切分', '按试次切分']; [0, 1].forEach((side) => { const x = side ? 329 : 20; panel(ctx, x, 30, 291, 218, titles[side]); for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { const xx = x + 26 + c * 30, yy = 72 + r * 29; const color = side === 0 ? (r < 3 ? P.train : r === 3 ? P.val : P.test) : (c < 6 ? P.train : c === 6 ? P.val : P.test); ctx.fillStyle = color; rr(ctx, xx, yy, 25, 22, 3); ctx.fill(); } label(ctx, side === 0 ? '测试：新身份' : '测试：已见身份的新试次', x + 145, 232, side === 0 ? P.green : P.amber, 11, 800, 'center'); });
  const focusX = selected === 0 ? 20 : 329; ctx.strokeStyle = selected === 0 ? P.green : P.amber; ctx.lineWidth = 3; rr(ctx, focusX + 2, 32, 287, 214, 7); ctx.stroke(); const scan = 72 + ((t / 14) % 138); line(ctx, focusX + 18, scan, focusX + 273, scan, selected === 0 ? P.green : P.amber, 1.4);
}

function drawStress(ctx: Ctx, selected: number, value: number, t: number) {
  panel(ctx, 18, 22, 604, 244, selected === 0 ? '标签稀缺：论文报告的标签预算' : '通道遮蔽：论文报告的证据区间');
  const x0 = 74, y0 = 205, w = 350;
  line(ctx, x0, y0, x0 + w, y0, P.muted, 1.2);
  label(ctx, selected === 0 ? '标签比例 k' : '遮蔽比例 p', x0 + w, 228, P.muted, 10, 600, 'right');
  if (selected === 0) {
    const budgets = [0, 2, 5, 10, 30];
    label(ctx, '预算位置', 42, 78, P.muted, 10, 600, 'center');
    budgets.forEach((budget, i) => {
      const x = x0 + i * w / 4;
      line(ctx, x, y0 - 8, x, y0 + 5, P.muted, 1);
      label(ctx, `${budget}%`, x, 224, P.ink, 10, 700, 'center');
      const dots = Math.max(1, Math.round(budget / 10));
      for (let d = 0; d < 10; d++) dot(ctx, x, 178 - d * 9, 3.5, d < dots ? P.blue : '#dce5ed', '#fff');
      if (i === value) { ctx.strokeStyle = P.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 137, 49, 0, Math.PI * 2); ctx.stroke(); }
    });
    label(ctx, '仅表示训练标签预算；纵向点阵不代表性能分数', 250, 252, P.muted, 10, 600, 'center');
    pill(ctx, '验证集最近邻预测', 458, 84, P.blue, true, 136);
    label(ctx, '零样本到 30% 标签预算', 526, 121, P.muted, 10, 600, 'center');
    label(ctx, '测试身份保持不变', 526, 145, P.green, 10, 700, 'center');
  } else {
    const masks = [0, 20, 40, 60, 80];
    label(ctx, '被遮蔽通道', 42, 78, P.muted, 10, 600, 'center');
    masks.forEach((mask, i) => {
      const x = x0 + i * w / 4;
      line(ctx, x, y0 - 8, x, y0 + 5, P.muted, 1);
      label(ctx, `${mask}%`, x, 224, P.ink, 10, 700, 'center');
      for (let d = 0; d < 10; d++) {
        const masked = d < Math.round(mask / 10);
        dot(ctx, x, 178 - d * 9, 3.5, masked ? P.red : P.blue, '#fff');
      }
      if (i === value) { ctx.strokeStyle = P.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 137, 49, 0, Math.PI * 2); ctx.stroke(); }
    });
    line(ctx, x0 + w * .2, 68, x0 + w * .4, 68, P.green, 4);
    label(ctx, 'BIOT 相对稳定', x0 + w * .3, 57, P.green, 10, 700, 'center');
    line(ctx, x0 + w * .6, 68, x0 + w * .8, 68, P.red, 4);
    label(ctx, '多数模型接近机会水平', x0 + w * .7, 57, P.red, 10, 700, 'center');
    pill(ctx, '证据区间', 458, 84, P.blue, true, 104);
    label(ctx, '20%–40%', 510, 121, P.green, 15, 800, 'center');
    label(ctx, 'BIOT 相对稳定', 510, 141, P.muted, 10, 600, 'center');
    label(ctx, '60%–80%', 510, 174, P.red, 15, 800, 'center');
    label(ctx, '多数模型接近机会水平', 510, 194, P.muted, 10, 600, 'center');
    label(ctx, '点阵只编码遮蔽比例，不编码未报告的性能值', 320, 252, P.muted, 10, 600, 'center');
  }
}

function drawInterface(ctx: Ctx, selected: number, t: number) {
  const standardized = selected === 1;
  const align = standardized ? Math.min(1, t / 560) : 0;
  const smooth = align * align * (3 - 2 * align);
  panel(ctx, 18, 18, 604, 258, standardized ? '同一测量夹具包住不同骨干' : '三套实验口径彼此错位');

  const xs = [39, 229, 419];
  const rawOffset = [-7, 8, -3];
  const rawInputWidth = [104, 132, 116];
  const latentWidth = [52, 91, 69];
  const colors = [P.blue, P.purple, P.amber];

  if (standardized) {
    ctx.globalAlpha = smooth;
    ctx.fillStyle = '#e8f4ef'; rr(ctx, 39, 47, 554, 25, 4); ctx.fill();
    ctx.strokeStyle = P.green; ctx.lineWidth = 1.5; rr(ctx, 39, 47, 554, 25, 4); ctx.stroke();
    label(ctx, '固定任务卡 Dⱼ：预处理 · xⱼ ∈ R^(Cⱼ×Tⱼ) · 标签空间 Yⱼ', 316, 64, P.green, 10, 800, 'center');
    line(ctx, 65, 77, 567, 77, P.green, 1, [4, 4]);
    ctx.globalAlpha = 1;
  }

  xs.forEach((x, i) => {
    const offset = rawOffset[i] * (1 - smooth);
    const y = 79 + offset;
    const inputWidth = rawInputWidth[i] + (132 - rawInputWidth[i]) * smooth;
    const inputX = x + (174 - inputWidth) / 2;
    const border = standardized ? P.green : P.red;

    const cardHeight = standardized ? 154 : 168;
    ctx.fillStyle = '#fbfcfe'; rr(ctx, x, y, 174, cardHeight, 6); ctx.fill();
    ctx.strokeStyle = standardized ? `rgba(39,129,95,${.42 + .58 * smooth})` : 'rgba(189,64,81,.62)';
    ctx.lineWidth = standardized ? 1.8 : 1.3; rr(ctx, x, y, 174, cardHeight, 6); ctx.stroke();
    label(ctx, `骨干 ${String.fromCharCode(65 + i)}`, x + 87, y + 18, P.ink, 11, 800, 'center');

    ctx.fillStyle = standardized ? '#e8f4ef' : '#faecee'; rr(ctx, inputX, y + 27, inputWidth, 23, 4); ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1.4; rr(ctx, inputX, y + 27, inputWidth, 23, 4); ctx.stroke();
    label(ctx, standardized ? '同一 xⱼ：Cⱼ×Tⱼ' : `x${i + 1}：C${i + 1}×T${i + 1}`, x + 87, y + 43, standardized ? P.green : P.red, 9, 800, 'center');

    const coreY = y + 66;
    if (i === 0) {
      for (let k = 0; k < 3; k++) waveform(ctx, x + 28, coreY + k * 10, 118, 3.2, t / 900 + k, [P.blue, P.cyan, P.purple][k]);
    } else if (i === 1) {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
        const alpha = .16 + ((r * 2 + c) % 4) * .16;
        ctx.fillStyle = `rgba(103,86,163,${alpha})`; ctx.fillRect(x + 31 + c * 16, coreY - 6 + r * 9, 11, 6);
      }
    } else {
      for (let k = 0; k < 6; k++) {
        const xx = x + 27 + k * 24, yy = coreY + 10 + Math.sin(k * 1.55) * 11;
        if (k) line(ctx, xx - 24, coreY + 10 + Math.sin((k - 1) * 1.55) * 11, xx, yy, P.line, 1.2);
        dot(ctx, xx, yy, 4.5, k % 2 ? P.amber : P.blue);
      }
    }
    label(ctx, 'fθᵢ（内部结构保留）', x + 87, y + 105, colors[i], 9, 700, 'center');

    label(ctx, `zᵢ ∈ R^(d${i + 1})`, x + 17, y + 124, P.muted, 9, 700);
    ctx.fillStyle = '#e6ebf1'; rr(ctx, x + 82, y + 117, 72, 7, 3.5); ctx.fill();
    ctx.fillStyle = colors[i]; rr(ctx, x + 82, y + 117, latentWidth[i] * .7, 7, 3.5); ctx.fill();
    label(ctx, standardized ? 'gᵢ → Yⱼ' : `head${i + 1}`, x + 87, y + 137, standardized ? P.green : P.red, 9, 800, 'center');

    if (!standardized) {
      const footW = [118, 145, 106][i];
      ctx.fillStyle = '#faecee'; rr(ctx, x + (174 - footW) / 2, y + 144, footW, 20, 4); ctx.fill();
      ctx.strokeStyle = P.red; ctx.lineWidth = 1; rr(ctx, x + (174 - footW) / 2, y + 144, footW, 20, 4); ctx.stroke();
      label(ctx, [`split₁ · m₁ ↑`, `split₂ · m₂ ↓`, `split₃ · m₃ ↑`][i], x + 87, y + 158, P.red, 9, 800, 'center');
    }
  });

  if (standardized) {
    ctx.globalAlpha = smooth;
    [126, 316, 506].forEach((x) => { line(ctx, x, 231, x, 240, P.green, 2); dot(ctx, x, 237, 3.5, P.green); });
    ctx.fillStyle = '#e8f4ef'; rr(ctx, 39, 241, 554, 24, 4); ctx.fill();
    ctx.strokeStyle = P.green; ctx.lineWidth = 1.5; rr(ctx, 39, 241, 554, 24, 4); ctx.stroke();
    label(ctx, '固定协议 Pⱼ：同一 split · 同一训练规则 · 同一 metric 与优劣方向', 316, 257, P.green, 10, 800, 'center');
    ctx.globalAlpha = 1;
  } else {
    label(ctx, '红色错位表示实验设置差异；下标仅作原理示意', 320, 270, P.red, 9, 700, 'center');
  }
}

function drawRanking(ctx: Ctx, selected: number, t: number) {
  const titles = ['基准规模', '线性探测：前三序位', '全量微调：平均名次（越低越好）', '通道遮蔽：证据区间', 'Scaling：因素与名次的关联'];
  const reveal = Math.min(1, t / 560);
  panel(ctx, 18, 22, 604, 244, titles[selected]);
  if (selected === 0) {
    const stats = [['54', '数据集'], ['58', '任务'], ['6', '能力类'], ['4', '评测协议'], ['10', '模型']];
    stats.forEach(([value, name], i) => {
      const x = 31 + i * 118;
      ctx.fillStyle = i === 4 ? '#fff4df' : '#f1f6fa'; rr(ctx, x, 78, 103, 112, 7); ctx.fill();
      ctx.strokeStyle = i === 4 ? P.amber : P.line; ctx.lineWidth = 1.2; rr(ctx, x, 78, 103, 112, 7); ctx.stroke();
      label(ctx, value, x + 51.5, 132, i === 4 ? P.amber : P.blue, 31, 800, 'center');
      label(ctx, name, x + 51.5, 163, P.muted, 11, 700, 'center');
    });
    label(ctx, '覆盖面决定比较的边界：每个数字都对应 benchmark 的一层设计', 320, 224, P.ink, 11, 700, 'center');
  } else if (selected === 1) {
    const names = ['BrainOmni', 'CBraMod', 'REVE'];
    label(ctx, '论文报告前三顺序，未给出可直接比较的平均名次数值', 320, 57, P.muted, 10, 600, 'center');
    names.forEach((name, i) => {
      const x = 136 + i * 145;
      const fullHeight = 82 - i * 10; const height = fullHeight * reveal; const y = 196 - height;
      ctx.fillStyle = [P.amber, P.blue, P.purple][i]; rr(ctx, x, y, 112, height, 6); ctx.fill();
      if (reveal > .38) { ctx.globalAlpha = Math.min(1, (reveal - .38) * 2.2); label(ctx, `第 ${i + 1}`, x + 56, y + 25, '#fff', 16, 800, 'center'); label(ctx, name, x + 56, y + 53, '#fff', 12, 800, 'center'); ctx.globalAlpha = 1; }
    });
    pill(ctx, '只训练线性头 g', 244, 220, P.green, true, 152);
  } else if (selected === 2) {
    const names = ['CBraMod', 'LaBraM', 'FEMBA']; const vals = [4.51, 4.88, 5.42]; const x0 = 170, x1 = 568, y0 = 88, row = 43;
    line(ctx, x0, 70, x1, 70, P.line, 1.2);
    [4, 4.5, 5, 5.5, 6].forEach((tick) => { const x = x0 + (tick - 4) / 2 * (x1 - x0); line(ctx, x, 70, x, 212, '#e5ebf0', 1); label(ctx, tick.toFixed(tick % 1 ? 1 : 0), x, 226, P.muted, 10, 600, 'center'); });
    label(ctx, '平均名次', x0, 56, P.muted, 10, 600); label(ctx, '左侧更好', x0, 245, P.green, 10, 700); label(ctx, '右侧更差', x1, 245, P.red, 10, 700, 'right');
    names.forEach((name, i) => { const y = y0 + i * row; const target = x0 + (vals[i] - 4) / 2 * (x1 - x0); const x = x0 + (target - x0) * reveal; label(ctx, name, 150, y + 5, P.ink, 12, 700, 'right'); line(ctx, x0, y, x, y, '#d4dee8', 2); dot(ctx, x, y, 8, [P.blue, P.cyan, P.purple][i]); if (reveal > .78) label(ctx, vals[i].toFixed(2), x + 14, y + 5, P.ink, 11, 800); });
  } else if (selected === 3) {
    label(ctx, '遮蔽比例 p', 87, 57, P.muted, 10, 600); const xs = [118, 205, 292, 379, 466]; const labels = ['0%', '20%', '40%', '60%', '80%'];
    xs.forEach((x, i) => { label(ctx, labels[i], x, 91, P.ink, 11, 700, 'center'); const maskedCount = Math.floor(i * 2 * reveal); for (let d = 0; d < 10; d++) dot(ctx, x, 121 + d * 10, 4, d < maskedCount ? P.red : P.blue, '#fff'); });
    line(ctx, 161, 226, 335, 226, P.green, 5); label(ctx, '20%–40%：BIOT 相对稳定', 248, 244, P.green, 10, 700, 'center'); line(ctx, 335, 226, 509, 226, P.red, 5); label(ctx, '60%–80%：多数模型接近机会水平', 422, 244, P.red, 10, 700, 'center');
  } else {
    const cards = [['预训练数据集数', 'median ρ = −0.27', 'p = 1.1×10⁻⁷'], ['模型参数量', 'median ρ = −0.21', 'p = 7.0×10⁻⁴']];
    cards.forEach((card, i) => { const x = 46 + i * 285; ctx.fillStyle = i === 0 ? '#e8f3fa' : '#f0edfa'; rr(ctx, x, 67, 255, 132, 7); ctx.fill(); ctx.strokeStyle = i === 0 ? P.blue : P.purple; ctx.lineWidth = 1.5; rr(ctx, x, 67, 255, 132, 7); ctx.stroke(); label(ctx, card[0], x + 18, 94, P.muted, 11, 700); label(ctx, card[1], x + 127, 139, i === 0 ? P.blue : P.purple, 20, 800, 'center'); label(ctx, card[2], x + 127, 171, P.muted, 10, 600, 'center'); });
    arrow(ctx, 91, 223, 91 + 160 * reveal, 223, P.green); arrow(ctx, 376, 223, 376 + 160 * reveal, 223, P.green); label(ctx, '因素增大', 88, 245, P.muted, 9); label(ctx, '排名数字降低（更好）', 320, 245, P.green, 10, 700, 'center');
  }
}

function drawBoundaryCheck(ctx: Ctx, selected: number) {
  panel(ctx, 20, 24, 600, 238, '一条结论需要穿过三道证据门'); const gates = [['数据范围', '54 数据集 / 58 任务'], ['评测条件', '协议 / 适配方式 / 指标'], ['推断强度', '事实 / 关联 / 因果']];
  gates.forEach((gate, i) => { const x = 43 + i * 192; const pass = selected === 0 || (selected === 1 && i < 2); const fail = selected === 2 && i === 2; ctx.fillStyle = pass ? '#e8f4ef' : fail ? '#faecee' : '#f2f4f7'; rr(ctx, x, 75, 166, 112, 7); ctx.fill(); ctx.strokeStyle = pass ? P.green : fail ? P.red : P.line; ctx.lineWidth = 1.5; rr(ctx, x, 75, 166, 112, 7); ctx.stroke(); label(ctx, `0${i + 1}`, x + 16, 98, pass ? P.green : fail ? P.red : P.muted, 11, 800); label(ctx, gate[0], x + 83, 128, P.ink, 13, 800, 'center'); label(ctx, gate[1], x + 83, 154, P.muted, 10, 600, 'center'); label(ctx, pass ? '✓' : fail ? '×' : '—', x + 83, 178, pass ? P.green : fail ? P.red : P.muted, 15, 800, 'center'); });
  pill(ctx, ['可核验事实', '补齐条件后成立', '证据链在因果门终止'][selected], 225, 213, selected === 0 ? P.green : selected === 2 ? P.red : P.amber, true, 190);
}

function draw(canvas: HTMLCanvasElement, variant: number, selected: number, value: number, t: number) {
  const mobileAdaptation = variant === 5 && (canvas.parentElement?.clientWidth ?? 640) < 520;
  const width = mobileAdaptation ? 360 : 640;
  const height = mobileAdaptation ? 420 : 300;
  const ctx = setupCanvas(canvas, width, height); ctx.clearRect(0, 0, width, height);
  if (variant === 5) { ctx.fillStyle = P.bg; ctx.fillRect(0, 0, width, height); }
  else gridBg(ctx);
  switch (variant) { case 1: drawComparability(ctx, selected, t); break; case 2: drawStack(ctx, selected, t); break; case 3: drawAtlas(ctx, selected); break; case 4: drawTaskCard(ctx, selected, t); break; case 5: drawAdaptation(ctx, selected, value, t, mobileAdaptation); break; case 6: drawProtocol(ctx, selected); break; case 7: drawBoundary(ctx, selected, t); break; case 8: drawStress(ctx, selected, value, t); break; case 9: drawInterface(ctx, selected, t); break; case 10: drawRanking(ctx, selected, t); break; case 11: drawBoundaryCheck(ctx, selected); break; default: drawStack(ctx, selected, t); }
  canvas.classList.add('is-ready');
}

export function InteractiveLab({ variant }: { variant: number }) {
  const lab = labs[variant];
  const [selected, setSelected] = useState(0);
  const [value, setValue] = useState(lab.initial ?? 0);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!playing || variant !== 5) return;
    if (value >= 100) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setValue((current) => Math.min(100, current + 2)), 36);
    return () => window.clearTimeout(timer);
  }, [playing, value, variant]);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let raf = 0; let live = true; let startedAt = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (t: number) => { draw(canvas, variant, selected, value, reduced ? 1000 : t - startedAt); if (live && !reduced) raf = requestAnimationFrame(tick); };
    const start = () => { live = true; startedAt = performance.now(); cancelAnimationFrame(raf); if (reduced) draw(canvas, variant, selected, value, 1000); else raf = requestAnimationFrame(tick); };
    const stop = () => { live = false; cancelAnimationFrame(raf); };
    draw(canvas, variant, selected, value, reduced ? 1000 : 0);
    const cleanupObserver = observeCanvas(canvas, start, stop);
    return () => { stop(); cleanupObserver(); };
  }, [variant, selected, value]);

  const handleCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * 640 / rect.width;
    const y = (event.clientY - rect.top) * 300 / rect.height;
    const nearest = (points: number[]) => points.reduce((best, point, index) => Math.abs(point - x) < Math.abs(points[best] - x) ? index : best, 0);
    setPlaying(false);
    if (variant === 3) setSelected(nearest([130, 180, 260, 344, 438, 522]));
    else if (variant === 4 && y >= 64 && y <= 200) setSelected(Math.max(0, Math.min(3, Math.floor((x - 38) / 144))));
    else if (variant === 7) setSelected(x < 320 ? 0 : 1);
    else if (variant === 8) setValue(nearest([74, 161.5, 249, 336.5, 424]));
  };

  const metric = useMemo(() => lab.metric(selected, value), [lab, selected, value]);
  const tone = lab.tone?.(selected, value) ?? 'neutral';
  const directCanvas = [3, 4, 7, 8].includes(variant);

  return <div className={`omni-lab ${variant === 5 ? 'omni-lab-adaptation' : ''}`}>
    <div className="omni-figure-head"><span>INTERACTIVE FIGURE</span><strong>{lab.label}</strong></div>
    <canvas ref={ref} width={640} height={300} className={directCanvas ? 'omni-direct-canvas' : undefined} aria-label={`${lab.label}：${metric}`} title={directCanvas ? '可直接点击图中区域' : undefined} onPointerDown={directCanvas ? handleCanvasPointer : undefined} />
    <div className="omni-controls" role="group" aria-label={lab.label}>{lab.options.map((option, i) => <button key={option} className={`chip ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} onClick={() => { setPlaying(false); setSelected(i); }}>{option}</button>)}</div>
    {lab.valueLabel ? <div className="omni-range">
      <span>{lab.valueLabel}<b>{metric}</b></span>
      <input aria-label={lab.valueLabel} type="range" min={lab.min} max={lab.max} step={lab.step} value={value} onChange={(e) => { setPlaying(false); setValue(Number(e.target.value)); }} />
      {variant === 5 ? <button type="button" className="omni-play" aria-label={playing ? '暂停训练演示' : '播放训练演示'} onClick={() => { if (playing) setPlaying(false); else { if (value >= 100) setValue(0); setPlaying(true); } }}>{playing ? 'Ⅱ 暂停' : value >= 100 ? '↻ 重播' : '▶ 演示'}</button> : null}
    </div> : <div className="omni-metric"><span>当前读数</span><b>{metric}</b></div>}
    <div className={`feedback ${tone}`} aria-live="polite">{lab.feedback(selected, value)}</div>
  </div>;
}

export const OmniSharedPreview: React.FC<WidgetProps> = () => <InteractiveLab variant={2} />;
