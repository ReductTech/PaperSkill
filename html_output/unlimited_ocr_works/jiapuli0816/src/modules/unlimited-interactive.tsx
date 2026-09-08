import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 278;
const C = {
  bg: '#f7f8f6',
  paper: '#ffffff',
  ink: '#1d2733',
  muted: '#68737d',
  line: '#dfe3e5',
  blue: '#244d6b',
  blueSoft: '#edf2f4',
  green: '#2e7158',
  greenSoft: '#eaf3ef',
  red: '#a54c59',
  redSoft: '#f7ecee',
  orange: '#a96836',
  purple: '#6d608a',
};

type Choice = { label: string; value: string };
type ControlKind = 'chips' | 'range' | 'steps';
type ModuleSpec = {
  primaryLabel: string;
  primary: Choice[];
  primaryControl?: ControlKind;
  defaultPrimary?: number;
  secondaryLabel?: string;
  secondary?: Choice[];
  defaultSecondary?: number;
};

type DrawState = {
  primary: number;
  secondary: number;
};

const SPECS: Record<string, ModuleSpec> = {
  '1.2': {
    primaryLabel: '已生成长度 T',
    primary: ['256', '512', '1024', '2048', '3072', '4096', '6144'].map((value) => ({ label: value, value })),
    primaryControl: 'range',
    secondaryLabel: '缓存方案',
    secondary: [{ label: '标准 MHA', value: 'mha' }, { label: 'R-SWA', value: 'rswa' }],
  },
  '2.1': {
    primaryLabel: '架构组件',
    primary: ['DeepEncoder', '16×桥接', '3B MoE', 'R-SWA', 'KV 队列'].map((label, index) => ({ label, value: String(index) })),
  },
  '3.1': {
    primaryLabel: '当前查询位置 t',
    primary: ['6', '8', '10', '12', '14', '16', '18'].map((value) => ({ label: value, value })),
    primaryControl: 'range',
    defaultPrimary: 2,
    secondaryLabel: '示意窗口宽度 n',
    secondary: ['4', '8', '12'].map((value) => ({ label: value, value })),
    defaultSecondary: 1,
  },
  '3.2': {
    primaryLabel: '当前输出进度',
    primary: [
      { label: '已写“总”', value: 'one' },
      { label: '已写“总计”', value: 'two' },
      { label: '已写“总计3”', value: 'three' },
    ],
    defaultPrimary: 0,
  } as ModuleSpec,
  '4.1': {
    primaryLabel: '当前生成步',
    primary: Array.from({ length: 10 }, (_, index) => ({ label: String(index), value: String(index) })),
    primaryControl: 'steps',
  },
  '5.1': {
    primaryLabel: '输出长度',
    primary: ['256', '512', '1024', '2048', '3072', '4096', '6144'].map((value) => ({ label: value, value })),
  },
  '6.1': {
    primaryLabel: '推理阶段',
    primary: ['页面输入', '压缩前缀', '首 token', '窗口滑动', '换页标记'].map((label, index) => ({ label, value: String(index) })),
    primaryControl: 'steps',
    secondaryLabel: '参考页数（示意）',
    secondary: ['2 页', '10 页', '40+ 页'].map((label) => ({ label, value: label })),
  },
  '7.1': {
    primaryLabel: '评测项',
    primary: [
      { label: 'v1.5 Overall', value: 'overall15' },
      { label: 'v1.5 Text Edit', value: 'edit15' },
      { label: 'v1.5 Formula CDM', value: 'cdm15' },
      { label: 'v1.5 Table TEDS', value: 'teds15' },
      { label: 'v1.5 Table TEDS-S', value: 'tedss15' },
      { label: 'v1.5 Read-order Edit', value: 'order15' },
      { label: 'v1.6 Overall', value: 'overall16' },
    ],
  },
  '8.1': {
    primaryLabel: '文档页数',
    primary: ['2', '5', '10', '15', '20', '40+'].map((value) => ({ label: value + (value === '40+' ? ' 页' : ' 页'), value })),
  },
  '8.2': {
    primaryLabel: '边界类型',
    primary: [{ label: '当前限制', value: 'current' }],
    secondaryLabel: '限制或规划',
    secondary: [
      { label: '32K 上下文', value: '32k' },
      { label: '未来 128K', value: '128k' },
      { label: 'prefill 池', value: 'pool' },
      { label: 'ASR / 翻译', value: 'transfer' },
    ],
  },
};

function txt(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 13, weight = 600) {
  ctx.fillStyle = color;
  ctx.font = (weight >= 700 ? 'bold ' : 'normal ') + size + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(value, x, y);
}

function centerText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 13) {
  ctx.save();
  ctx.textAlign = 'center';
  txt(ctx, value, x, y, color, size);
  ctx.restore();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = C.paper, stroke = C.line) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ratio: number, color: string) {
  const radius = Math.min(5, h / 2);
  ctx.fillStyle = '#eef1f5';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  const filled = w * clamp(ratio, 0, 1);
  if (filled <= 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, filled, h, Math.min(radius, filled / 2));
  ctx.fill();
}

function token(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, fill: string, stroke = fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, 25, 27, 5);
  ctx.fill();
  ctx.stroke();
  centerText(ctx, label, x + 12.5, y + 18, fill === C.blue || fill === C.green || fill === C.red || fill === C.purple ? '#fff' : C.ink, 10);
}

function heading(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  txt(ctx, title, 20, 27, C.ink, 16, 800);
  txt(ctx, subtitle, 20, 48, C.muted, 12, 500);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 57.5);
  ctx.lineTo(W - 20, 57.5);
  ctx.stroke();
}

function cacheChunk(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, stroke: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, 18, 30, 3);
  ctx.fill();
  ctx.stroke();
}

function currentPointer(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.orange;
  ctx.fillStyle = C.orange;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 5);
  ctx.lineTo(x - 5, y - 2);
  ctx.lineTo(x + 5, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFixedHistoryStrip(ctx: CanvasRenderingContext2D, t: number, rswa: boolean) {
  const y = 132;
  const outputStart = 108;
  const step = 22;
  const logicalOutputChunks = rswa ? 1 : t / 128;

  txt(ctx, '参考 256', 36, 113, C.blue, 10, 750);
  txt(ctx, rswa ? '输出窗口 n=128' : '完整输出历史 T=' + t, outputStart, 113, rswa ? C.green : C.red, 10, 750);
  cacheChunk(ctx, 44, y, C.blueSoft, C.blue);
  cacheChunk(ctx, 66, y, C.blueSoft, C.blue);
  ctx.strokeStyle = '#b8c0c4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, y - 2);
  ctx.lineTo(96, y + 32);
  ctx.stroke();

  let lastX = outputStart;
  if (logicalOutputChunks <= 8) {
    for (let i = 0; i < logicalOutputChunks; i += 1) {
      lastX = outputStart + i * step;
      cacheChunk(ctx, lastX, y, rswa ? C.greenSoft : C.redSoft, rswa ? C.green : C.red);
    }
  } else {
    for (let i = 0; i < 5; i += 1) cacheChunk(ctx, outputStart + i * step, y, C.redSoft, C.red);
    centerText(ctx, '···', 230, y + 20, C.muted, 13);
    for (let i = 0; i < 3; i += 1) {
      lastX = 250 + i * step;
      cacheChunk(ctx, lastX, y, C.redSoft, C.red);
    }
  }

  currentPointer(ctx, lastX + 9, y - 4);
  txt(ctx, rswa ? '固定 1 个输出块' : '共 ' + logicalOutputChunks + ' 个输出块', outputStart, 184, rswa ? C.green : C.red, 11, 800);
  txt(ctx, logicalOutputChunks > 8 ? '中段以断轴省略；每个方块仍是同样大小' : '向右增加方块；单个方块大小不变', 36, 207, C.muted, 10, 600);

  cacheChunk(ctx, 36, 218, C.blueSoft, C.blue);
  txt(ctx, '参考', 59, 238, C.blue, 9, 700);
  cacheChunk(ctx, 103, 218, rswa ? C.greenSoft : C.redSoft, rswa ? C.green : C.red);
  txt(ctx, rswa ? '近期输出' : '历史输出', 126, 238, rswa ? C.green : C.red, 9, 700);
  currentPointer(ctx, 202, 230);
  txt(ctx, '当前端点', 216, 238, C.orange, 9, 700);
}

export function drawUnlimitedModule(ctx: CanvasRenderingContext2D, moduleId: string, state: DrawState) {
  const spec = SPECS[moduleId];
  const primary = spec.primary[state.primary]?.value || '';
  const secondary = spec.secondary?.[state.secondary]?.value || '';

  if (moduleId === '1.2') {
    const t = Number(primary);
    const rswa = secondary === 'rswa';
    const mhaCount = 256 + t;
    const rswaCount = 256 + Math.min(128, t);
    heading(ctx, '缓存块尺寸固定，数量随 T 变化', '示意每格=128；取 Lₘ=256（不计提示词），n=128');
    panel(ctx, 20, 64, 326, 184);
    txt(ctx, rswa ? '当前：R-SWA' : '当前：标准 MHA', 36, 88, rswa ? C.green : C.red, 13, 800);
    drawFixedHistoryStrip(ctx, t, rswa);

    panel(ctx, 360, 64, 180, 184);
    panel(ctx, 374, 79, 152, 70, rswa ? C.paper : C.redSoft, rswa ? C.line : C.red);
    txt(ctx, '标准 MHA', 387, 99, C.red, 11, 800);
    txt(ctx, '256 + ' + t, 387, 119, C.muted, 10, 600);
    txt(ctx, '= ' + mhaCount, 387, 142, C.red, 17, 800);
    txt(ctx, '随 T 线性增长', 452, 141, C.red, 9, 700);

    panel(ctx, 374, 160, 152, 70, rswa ? C.greenSoft : C.paper, rswa ? C.green : C.line);
    txt(ctx, 'R-SWA', 387, 180, C.green, 11, 800);
    txt(ctx, '256 + 128', 387, 200, C.muted, 10, 600);
    txt(ctx, '= ' + rswaCount, 387, 223, C.green, 17, 800);
    txt(ctx, 'T≥128 后固定', 444, 222, C.green, 9, 700);
    txt(ctx, '精确位置数', 374, 245, C.muted, 9, 650);
    return;
  }

  if (moduleId === '2.1') {
    const selected = state.primary;
    const labels = ['DeepEncoder', '16×桥接', '3B MoE', 'R-SWA', 'KV 队列'];
    const inherited = selected < 3;
    heading(ctx, '同一底座，只改注意力', inherited ? '蓝色｜继承自 DeepSeek-OCR' : '绿色｜Unlimited OCR 的改动');
    for (let i = 0; i < labels.length; i += 1) {
      const x = 18 + i * 107;
      const activeColor = i < 3 ? C.blue : C.green;
      panel(ctx, x, 76, 96, 62, i === selected ? (i < 3 ? C.blueSoft : C.greenSoft) : C.paper, i === selected ? activeColor : C.line);
      centerText(ctx, labels[i], x + 48, 104, i === selected ? activeColor : C.ink, 11);
      centerText(ctx, i < 3 ? '继承' : '替换后', x + 48, 125, i < 3 ? C.blue : C.green, 9);
      if (i < labels.length - 1) txt(ctx, '→', x + 97, 111, C.muted, 15);
    }
    const details = [
      'SAM-ViT 与 CLIP-ViT 提取页面视觉特征；继续训练时保持冻结。',
      '视觉 token 序列缩短 16×；Base 的 1024² 页面得到 256 个 token。',
      '解码器总规模 3B，每一步约激活 0.5B 参数。',
      '所有解码器全局注意力层均替换为 R-SWA。',
      '参考 KV 常驻；输出 KV 只保留最近 n 个位置。',
    ];
    const evidence = ['视觉编码', '前缀 ÷16', '≈0.5B 激活', 'P ∪ Dₙ(t)', '≤ Lₘ+n'];
    panel(ctx, 28, 159, 504, 78, inherited ? C.blueSoft : C.greenSoft, inherited ? C.blue : C.green);
    txt(ctx, inherited ? 'DeepSeek-OCR 底座' : 'Unlimited OCR 改动', 46, 185, inherited ? C.blue : C.green, 12, 800);
    txt(ctx, labels[selected], 46, 211, C.ink, 16, 800);
    panel(ctx, 408, 173, 105, 35, '#ffffff', inherited ? '#afc0ca' : '#9ebfae');
    centerText(ctx, evidence[selected], 460, 195, inherited ? C.blue : C.green, 11);
    txt(ctx, details[selected], 46, 234, C.muted, 10);
    return;
  }

  if (moduleId === '3.1') {
    const query = Number(primary);
    const windowSize = Number(secondary);
    heading(ctx, 'R-SWA 的可访问位置', '参考始终可见；输出窗口沿因果方向滑动');
    panel(ctx, 18, 65, 524, 180);

    panel(ctx, 30, 84, 173, 137, C.paper, C.line);
    txt(ctx, '当前可见记忆', 44, 105, C.ink, 11, 750);
    panel(ctx, 44, 116, 55, 34, C.blueSoft, C.blue);
    centerText(ctx, '参考 P', 71, 137, C.blue, 10);
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.line;
    ctx.fillRect(44, 171, 143, 28);
    ctx.strokeRect(44, 171, 143, 28);
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i >= 4 ? C.greenSoft : '#eef1f5';
      ctx.fillRect(49 + i * 16, 176, 13, 18);
    }
    const lifeX = 49 + Math.round((query - 6) / 12 * 4) * 16;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.strokeRect(Math.min(113, lifeX), 173, 69, 24);
    txt(ctx, '近期 Dₙ(t)', 106, 160, C.green, 9, 750);

    const matrixX = 238;
    const matrixY = 87;
    const cell = 14;
    const refCols = 4;
    const outCols = 10;
    const rows = 10;
    const selectedRow = Math.round((query - 6) / 12 * (rows - 1));
    const scaledWindow = windowSize === 4 ? 2 : windowSize === 8 ? 4 : 6;
    txt(ctx, 'key →', matrixX, 79, C.muted, 9, 650);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < refCols + outCols; col += 1) {
        const outputCol = col - refCols;
        const visibleOutput = col >= refCols && outputCol <= row && outputCol >= row - scaledWindow + 1;
        ctx.fillStyle = col < refCols ? C.blue : visibleOutput ? C.green : '#303946';
        ctx.globalAlpha = row === selectedRow ? 1 : 0.64;
        ctx.fillRect(matrixX + col * cell, matrixY + row * cell, cell - 2, cell - 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 4;
    ctx.strokeRect(matrixX - 3, matrixY + selectedRow * cell - 3, (refCols + outCols) * cell + 3, cell + 3);
    txt(ctx, 'P', matrixX + 18, 238, C.blue, 10, 800);
    txt(ctx, '因果输出', matrixX + 79, 238, C.muted, 10, 700);
    txt(ctx, '当前 t=' + query, 453, 112, C.orange, 10, 750);
    txt(ctx, '蓝｜参考常驻', 453, 140, C.blue, 9, 700);
    txt(ctx, '绿｜最近 ' + windowSize, 453, 161, C.green, 9, 700);
    txt(ctx, '灰｜窗口之外', 453, 182, C.muted, 9, 700);
    txt(ctx, '矩阵为比例示意', 453, 213, C.muted, 9, 600);
    return;
  }

  if (moduleId === '3.2') {
    const stage = state.primary;
    const reference = ['总', '计', '3', '6'];
    const next = reference[stage + 1];
    const targetX = 155 + (stage + 1) * 50 + 21;
    const recentX = 155 + stage * 50 + 21;
    heading(ctx, '参考告诉“下一字”，近期输出标记“写到哪”', '字符级教学示意｜实际模型按 token 处理');
    panel(ctx, 18, 64, 524, 184);

    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(targetX, 113);
    ctx.bezierCurveTo(targetX + 54, 113, 337, 111, 388, 122);
    ctx.stroke();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(recentX, 177);
    ctx.bezierCurveTo(recentX + 60, 177, 340, 184, 388, 166);
    ctx.stroke();

    txt(ctx, '固定参考 P', 34, 91, C.blue, 11, 800);
    txt(ctx, '始终可见', 34, 108, C.muted, 9, 650);
    txt(ctx, '近期输出 Dₙ(t)', 34, 155, C.green, 11, 800);
    txt(ctx, '用来定位', 34, 172, C.muted, 9, 650);

    for (let i = 0; i < reference.length; i += 1) {
      const x = 155 + i * 50;
      const isTarget = i === stage + 1;
      panel(ctx, x, 76, 42, 37, isTarget ? C.blueSoft : C.paper, isTarget ? C.blue : C.line);
      centerText(ctx, reference[i], x + 21, 101, isTarget ? C.blue : C.ink, 16);
      if (isTarget) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, 74, 46, 41);
      }
    }

    for (let i = 0; i < reference.length; i += 1) {
      const x = 155 + i * 50;
      const occupied = i <= stage;
      const isLatest = i === stage;
      panel(ctx, x, 141, 42, 37, occupied ? C.greenSoft : '#f2f4f4', occupied ? (isLatest ? C.green : '#b8d0c4') : C.line);
      centerText(ctx, occupied ? reference[i] : '·', x + 21, 166, occupied ? C.green : C.muted, 16);
      if (isLatest) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, 139, 46, 41);
      }
    }

    panel(ctx, 388, 88, 134, 102, '#fffaf2', '#d6b58e');
    centerText(ctx, '当前查询', 455, 111, C.orange, 10);
    centerText(ctx, '下一字', 455, 135, C.muted, 10);
    centerText(ctx, next, 455, 173, C.orange, 29);

    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(42, 218, 4, 0, Math.PI * 2);
    ctx.fill();
    txt(ctx, '参考：读下一字', 52, 222, C.blue, 9, 700);
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(174, 218, 4, 0, Math.PI * 2);
    ctx.fill();
    txt(ctx, '近期：定位进度', 184, 222, C.green, 9, 700);
    txt(ctx, '更早输出：窗口外，权重为 0', 342, 222, C.muted, 9, 650);
    return;
  }

  if (moduleId === '4.1') {
    const step = Number(primary);
    heading(ctx, '参考常驻，输出队列定长', '图中 n=4；论文默认 n=128');
    panel(ctx, 18, 64, 524, 184);
    txt(ctx, '参考 KV｜始终保留', 32, 92, C.blue, 12, 700);
    for (let i = 0; i < 6; i += 1) token(ctx, 32 + i * 34, 104, 'P' + (i + 1), C.blue);
    txt(ctx, '输出 KV｜最多 4 个', 32, 169, C.green, 12, 700);
    const start = Math.max(1, step - 3);
    for (let i = 0; i < 4; i += 1) {
      const id = start + i;
      const occupied = id <= step;
      token(ctx, 32 + i * 48, 181, occupied ? 'O' + id : '空', occupied ? (id === step ? C.orange : C.green) : '#eef1f5', occupied ? undefined : C.line);
    }
    if (step > 4) {
      token(ctx, 268, 181, 'O' + (step - 4), '#eef1f5', C.line);
      txt(ctx, '← 淘汰', 298, 199, C.muted, 11);
    }
    const count = 6 + Math.min(4, step);
    panel(ctx, 390, 96, 130, 112, C.greenSoft, C.green);
    centerText(ctx, '当前缓存位置', 455, 123, C.green, 12);
    centerText(ctx, String(count), 455, 163, C.green, 30);
    centerText(ctx, step < 4 ? '队列填充中' : '保持 Lₘ+n', 455, 190, C.green, 11);
    return;
  }

  if (moduleId === '5.1') {
    const lengths = [256, 512, 1024, 2048, 3072, 4096, 6144];
    const deepseek = [7229.32, 7468.27, 7422.50, 7166.85, 6790.72, 6430.21, 5822.87];
    const unlimited = [7229.52, 7714.78, 7840.94, 7881.11, 7881.93, 7905.18, 7847.71];
    const index = state.primary;
    const length = lengths[index];
    const a = deepseek[index];
    const b = unlimited[index];
    const gain = ((b / a - 1) * 100).toFixed(1);
    heading(ctx, '输出越长，R-SWA 越能守住吞吐', 'Table 4｜prefill=10，理想并发下的理论 TPS');
    panel(ctx, 18, 64, 524, 184);
    const chartX = 48;
    const chartY = 86;
    const chartW = 316;
    const chartH = 125;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();
    const toX = (i: number) => chartX + (i / (lengths.length - 1)) * chartW;
    const toY = (value: number) => chartY + chartH - ((value - 5600) / 2500) * chartH;
    const drawLine = (values: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      values.forEach((value, i) => {
        const x = toX(i);
        const y = toY(value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    drawLine(deepseek, C.red);
    drawLine(unlimited, C.green);
    for (let i = 0; i < lengths.length; i += 1) {
      ctx.fillStyle = i === index ? C.orange : C.muted;
      ctx.beginPath();
      ctx.arc(toX(i), toY(deepseek[i]), i === index ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i === index ? C.orange : C.green;
      ctx.beginPath();
      ctx.arc(toX(i), toY(unlimited[i]), i === index ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    txt(ctx, '8000', 18, 91, C.muted, 9);
    txt(ctx, '5600', 18, 215, C.muted, 9);
    txt(ctx, '256', 42, 229, C.muted, 9);
    txt(ctx, '6144', 340, 229, C.muted, 9);
    panel(ctx, 385, 84, 137, 128, C.paper, C.line);
    txt(ctx, String(length) + ' token', 402, 108, C.ink, 12, 800);
    txt(ctx, 'DeepSeek-OCR', 402, 133, C.red, 10, 700);
    txt(ctx, a.toFixed(2), 402, 151, C.red, 15, 800);
    txt(ctx, 'Unlimited OCR', 402, 177, C.green, 10, 700);
    txt(ctx, b.toFixed(2), 402, 195, C.green, 15, 800);
    txt(ctx, index === 0 ? '短序列几乎持平' : '理论吞吐 +' + gain + '%', 402, 229, index === 0 ? C.muted : C.blue, 10, 800);
    return;
  }

  if (moduleId === '6.1') {
    const stage = state.primary;
    const pages = state.secondary === 0 ? 2 : state.secondary === 1 ? 10 : 40;
    heading(ctx, '一次前向贯穿多页', '共享参考前缀与输出状态');
    panel(ctx, 18, 63, 524, 186);
    const stageLabels = ['页面进入', '压缩前缀', '生成首 token', '输出窗滑动', '写入换页标记'];
    for (let i = 0; i < 5; i += 1) {
      const x = 30 + i * 102;
      ctx.fillStyle = i <= stage ? (i === stage ? C.orange : C.blue) : '#e5e9ef';
      ctx.beginPath();
      ctx.arc(x + 30, 94, 12, 0, Math.PI * 2);
      ctx.fill();
      if (i < 4) {
        ctx.strokeStyle = i < stage ? C.blue : C.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 43, 94);
        ctx.lineTo(x + 88, 94);
        ctx.stroke();
      }
      centerText(ctx, String(i + 1), x + 30, 99, '#fff', 10);
      centerText(ctx, stageLabels[i], x + 30, 124, i === stage ? C.orange : C.muted, 10);
    }
    panel(ctx, 30, 145, 298, 88, C.paper, C.line);
    txt(ctx, '常驻参考前缀', 43, 166, C.blue, 11, 750);
    bar(ctx, 43, 175, 202, 13, Math.min(1, 0.18 + pages / 48), C.blue);
    txt(ctx, pages === 40 ? '40+ 页｜prefill 增长' : String(pages) + ' 页参考', 252, 186, pages === 40 ? C.orange : C.blue, 9, 700);
    txt(ctx, '近期输出窗', 43, 211, C.green, 11, 750);
    bar(ctx, 98, 200, 147, 13, stage >= 3 ? 0.62 : 0.2, C.green);
    txt(ctx, stage >= 3 ? '滑动且有界' : '等待解码', 252, 212, C.green, 9, 700);

    panel(ctx, 345, 145, 180, 88, '#fffdf7', C.line);
    txt(ctx, '跨页检查', 358, 165, C.ink, 10, 800);
    const checks = ['表格续行', '公式承接', '章节连贯'];
    for (let i = 0; i < checks.length; i += 1) {
      ctx.fillStyle = stage >= 4 ? C.green : C.blueSoft;
      ctx.beginPath();
      ctx.arc(362, 181 + i * 16, 4, 0, Math.PI * 2);
      ctx.fill();
      txt(ctx, checks[i], 374, 185 + i * 16, stage >= 4 ? C.green : C.muted, 9, 700);
    }
    return;
  }

  if (moduleId === '7.1') {
    const metric = primary;
    const rows: Record<string, { name: string; a: number; b: number; max: number; lower: boolean; unit: string }> = {
      overall15: { name: 'OmniDocBench v1.5 Overall', a: 87.01, b: 93.23, max: 100, lower: false, unit: '' },
      edit15: { name: 'OmniDocBench v1.5 Text Edit', a: 0.073, b: 0.038, max: 0.1, lower: true, unit: '' },
      cdm15: { name: 'OmniDocBench v1.5 Formula CDM', a: 83.37, b: 92.61, max: 100, lower: false, unit: '' },
      teds15: { name: 'OmniDocBench v1.5 Table TEDS', a: 84.97, b: 90.93, max: 100, lower: false, unit: '' },
      tedss15: { name: 'OmniDocBench v1.5 Table TEDS-S', a: 88.80, b: 94.07, max: 100, lower: false, unit: '' },
      order15: { name: 'OmniDocBench v1.5 Read-order Edit', a: 0.086, b: 0.045, max: 0.1, lower: true, unit: '' },
      overall16: { name: 'OmniDocBench v1.6 Overall', a: 0, b: 93.92, max: 100, lower: false, unit: '' },
    };
    const row = rows[metric];
    heading(ctx, row.name, metric === 'overall16' ? '仅作 v1.6 表内解释' : row.lower ? '指标方向｜越低越好' : '指标方向｜越高越好');
    panel(ctx, 20, 64, 520, 180);
    txt(ctx, metric === 'overall16' ? '跨版本基线' : 'DeepSeek-OCR', 34, 101, metric === 'overall16' ? C.muted : C.red, 12, 700);
    txt(ctx, 'Unlimited OCR', 34, 169, C.green, 12, 700);
    bar(ctx, 172, 87, 330, 18, metric === 'overall16' ? 0 : row.a / row.max, C.red);
    bar(ctx, 172, 155, 330, 18, row.b / row.max, C.green);
    txt(ctx, metric === 'overall16' ? '不提供跨版本配对' : String(row.a) + row.unit, 172, 126, metric === 'overall16' ? C.muted : C.red, 12);
    txt(ctx, String(row.b) + row.unit, 172, 194, C.green, 12);
    const note = metric === 'overall15'
      ? '同一 v1.5 协议｜高 6.22 点'
      : metric === 'edit15'
        ? '0.038 < 0.073｜更低更好'
        : metric === 'cdm15'
          ? '公式识别｜高 9.24 点'
        : metric === 'teds15'
          ? '表格结构相似度｜高 5.96 点'
          : metric === 'tedss15'
            ? '忽略内容的表格结构｜高 5.27 点'
            : metric === 'order15'
              ? '0.045 < 0.086｜更低更好'
          : '93.92｜不与 v1.5 基线配对';
    txt(ctx, note, 172, 226, C.blue, 13, 800);
    return;
  }

  if (moduleId === '8.1') {
    const pageIndex = state.primary;
    const pages = ['2', '5', '10', '15', '20', '40+'];
    const distinct = [99.87, 99.98, 99.83, 99.99, 99.89, 96.90];
    const edit = [0.0362, 0.0452, 0.0526, 0.0787, 0.0572, 0.1069];
    const isLong = pageIndex === pages.length - 1;
    heading(ctx, '作者自建长页集', '六个页数档位｜指标并非单调变化');
    panel(ctx, 18, 64, 524, 184);
    panel(ctx, 34, 82, 215, 118, isLong ? '#fff7ed' : C.greenSoft, isLong ? C.orange : C.green);
    txt(ctx, 'Distinct-35  ↑', 50, 108, C.muted, 11, 700);
    centerText(ctx, distinct[pageIndex].toFixed(2) + '%', 141, 153, isLong ? C.orange : C.green, 27);
    txt(ctx, '输出多样性保持率', 50, 185, C.muted, 10);
    panel(ctx, 267, 82, 257, 118, isLong ? C.redSoft : C.blueSoft, isLong ? C.red : C.blue);
    txt(ctx, 'Edit Distance  ↓', 283, 108, C.muted, 11, 700);
    centerText(ctx, edit[pageIndex].toFixed(4), 395, 153, isLong ? C.red : C.blue, 27);
    txt(ctx, '越低越接近参考答案', 283, 185, C.muted, 10);
    const x0 = 54;
    const gap = 88;
    for (let i = 0; i < pages.length; i += 1) {
      ctx.strokeStyle = i === pageIndex ? C.orange : C.line;
      ctx.lineWidth = i === pageIndex ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x0 + i * gap, 216);
      ctx.lineTo(x0 + i * gap, 231);
      ctx.stroke();
      centerText(ctx, pages[i] + ' 页', x0 + i * gap, 246, i === pageIndex ? C.orange : C.muted, 9);
    }
    txt(ctx, '论文原表｜每个页数档至少 10 本材料', 34, 267, C.muted, 9);
    return;
  }

  const future = secondary !== '32k';
  heading(ctx, '长页证据与“无限”的边界', future ? '紫色表示未来方向，并非本文实测' : '输出缓存有界；视觉 prefill 仍会增长');
  panel(ctx, 18, 64, 320, 181);
  txt(ctx, '作者自建长页集', 34, 92, C.blue, 13, 800);
  panel(ctx, 34, 109, 133, 84, C.greenSoft, '#9ebfae');
  txt(ctx, 'Distinct-35  ↑', 48, 132, C.muted, 10, 700);
  centerText(ctx, '96.90%', 100, 167, C.green, 22);
  panel(ctx, 183, 109, 139, 84, '#fff7ed', '#d3b092');
  txt(ctx, 'Edit Distance  ↓', 197, 132, C.muted, 10, 700);
  centerText(ctx, '0.1069', 252, 167, C.orange, 22);
  txt(ctx, '40+ 页档 · 每档至少 10 本材料', 34, 216, C.ink, 10, 700);
  txt(ctx, '作者自建集｜不与 OmniDocBench 混比', 34, 233, C.muted, 9);
  panel(ctx, 354, 64, 188, 181, future ? '#f5f3ff' : '#fff7ed', future ? C.purple : C.orange);
  txt(ctx, future ? '未来工作' : '当前限制', 372, 94, future ? C.purple : C.orange, 13, 800);
  if (secondary === '32k') {
    txt(ctx, '有限 32K 上下文', 372, 127, C.ink, 12);
    txt(ctx, '视觉 prefill 随页数增长', 372, 154, C.ink, 12);
    txt(ctx, '并非字面无限', 372, 193, C.orange, 13, 800);
  } else if (secondary === '128k') {
    txt(ctx, '计划扩展到 128K', 372, 127, C.ink, 12);
    txt(ctx, '本文尚未验证', 372, 166, C.purple, 13, 800);
  } else if (secondary === 'pool') {
    txt(ctx, '计划建立 prefill 池', 372, 127, C.ink, 12);
    txt(ctx, '本文尚未验证', 372, 166, C.purple, 13, 800);
  } else {
    txt(ctx, '计划迁移 R-SWA', 372, 127, C.ink, 12);
    txt(ctx, 'ASR 与翻译', 372, 151, C.ink, 12);
    txt(ctx, '本文尚未验证', 372, 184, C.purple, 13, 800);
  }
}

function feedbackFor(moduleId: string, primary: number, secondary: number) {
  const spec = SPECS[moduleId];
  const p = spec.primary[primary]?.value || '';
  const s = spec.secondary?.[secondary]?.value || '';
  if (moduleId === '1.2') {
    const length = Number(p);
    return s === 'rswa'
      ? { text: 'R-SWA 示意｜T=' + length + '，缓存 384，已封顶。', cls: 'good' }
      : { text: 'MHA 示意｜T=' + length + '，缓存 ' + (256 + length) + '，随 T 增长。', cls: length >= 2048 ? 'bad' : '' };
  }
  if (moduleId === '2.1') {
    const notes = [
      '继承｜DeepEncoder 提取视觉特征，训练时冻结。',
      '继承｜16×桥接把 Base 页面压为 256 个视觉 token。',
      '继承｜3B MoE 每步约激活 0.5B 参数。',
      '本文改动｜解码器 MHA 全部替换为 R-SWA。',
      'R-SWA｜参考常驻；输出最多保留最近 n 个。',
    ];
    return { text: notes[primary], cls: primary >= 3 ? 'good' : '' };
  }
  if (moduleId === '3.1') return { text: 't=' + p + '，n=' + s + '｜参考全可见；输出只看最近 n 个。', cls: 'good' };
  if (moduleId === '3.2') {
    const notes: Record<string, string> = {
      one: '已写“总”｜参考中的“计”回答下一字；近期的“总”标记当前进度。',
      two: '已写“总计”｜参考中的“3”回答下一字；近期的“计”标记当前进度。',
      three: '已写“总计3”｜参考中的“6”回答下一字；近期的“3”标记当前进度。',
    };
    return { text: notes[p], cls: 'good' };
  }
  if (moduleId === '4.1') return { text: Number(p) < 4 ? '第 ' + p + ' 步｜队列填充中。' : '第 ' + p + ' 步｜新进一个，淘汰一个。', cls: Number(p) < 4 ? '' : 'good' };
  if (moduleId === '5.1') {
    const deepseek = [7229.32, 7468.27, 7422.50, 7166.85, 6790.72, 6430.21, 5822.87][primary];
    const unlimited = [7229.52, 7714.78, 7840.94, 7881.11, 7881.93, 7905.18, 7847.71][primary];
    return { text: p + ' token｜Unlimited ' + unlimited.toFixed(2) + '；DeepSeek ' + deepseek.toFixed(2) + ' TPS。', cls: primary === 0 ? '' : 'good' };
  }
  if (moduleId === '6.1') {
    const stages = [
      '页面输入｜所有页面进入同一次前向。',
      '压缩前缀｜页面变为共享视觉前缀。',
      '首个 token｜查询可访问全部参考。',
      '窗口滑动｜输出侧工作记忆保持有界。',
      '换页标记｜输出序列不重启。',
    ];
    const boundary = secondary === 2 ? ' 32K 与增长的视觉前缀仍是边界。' : '';
    return { text: stages[primary] + boundary, cls: secondary === 2 ? '' : 'good' };
  }
  if (moduleId === '7.1') {
    const notes = [
      'v1.5 Overall｜93.23 对 87.01，同协议提升 6.22 点。',
      'v1.5 Text Edit｜0.038 对 0.073；编辑距离越低越好。',
      'v1.5 Formula CDM｜92.61 对 83.37；越高越好。',
      'v1.5 Table TEDS｜90.93 对 84.97；结构相似度越高越好。',
      'v1.5 Table TEDS-S｜94.07 对 88.80；越高越好。',
      'v1.5 Read-order Edit｜0.045 对 0.086；越低越好。',
      'v1.6 Overall｜Unlimited OCR 为 93.92；不提供跨版本配对。',
    ];
    return { text: notes[primary], cls: 'good' };
  }
  if (moduleId === '8.1') {
    const distinct = [99.87, 99.98, 99.83, 99.99, 99.89, 96.90][primary];
    const edit = [0.0362, 0.0452, 0.0526, 0.0787, 0.0572, 0.1069][primary];
    return { text: p + ' 页档｜Distinct-35 ' + distinct.toFixed(2) + '%，Edit Distance ' + edit.toFixed(4) + '；来自作者自建长页集。', cls: primary === 5 ? '' : 'good' };
  }
  if (s !== '32k') {
    const futureLabel = s === '128k' ? '128K 上下文' : s === 'pool' ? 'prefill 池' : '迁移至 ASR / 翻译';
    return { text: '未来工作｜' + futureLabel + '尚无本文验证分数。', cls: '' };
  }
  return { text: '当前限制｜上下文仍为 32K，视觉 prefill 随页数增长；R-SWA 固定的是输出侧缓存。', cls: 'good' };
}

function ChoiceRow({ label, choices, selected, onSelect }: { label: string; choices: Choice[]; selected: number; onSelect: (index: number) => void }) {
  return (
    <div className="lesson-choice-group" aria-label={label}>
      <div className="lesson-control-title">{label}</div>
      <div className="chip-row lesson-chip-row">
        {choices.map((choice, index) => (
          <button key={choice.value} type="button" className={'chip ' + (selected === index ? 'selected' : '')} onClick={() => onSelect(index)} aria-pressed={selected === index}>
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type EvidenceRow = {
  label: string;
  tone: 'baseline' | 'method' | 'neutral';
  values: string[];
};

function EvidenceTable({ moduleId, selected }: { moduleId: string; selected: number }) {
  let caption = '';
  let ariaLabel = '';
  let columns: string[] = [];
  let rows: EvidenceRow[] = [];

  if (moduleId === '5.1') {
    caption = 'Table 4｜理论 TPS 上限 · prefill=10 · 理想并发';
    ariaLabel = '论文 Table 4，prefill 为 10、理想并发条件下的理论 TPS 上限';
    columns = ['256', '512', '1024', '2048', '3072', '4096', '6144'];
    rows = [
      { label: 'DeepSeek-OCR', tone: 'baseline', values: ['7229.32', '7468.27', '7422.50', '7166.85', '6790.72', '6430.21', '5822.87'] },
      { label: 'Unlimited OCR', tone: 'method', values: ['7229.52', '7714.78', '7840.94', '7881.11', '7881.93', '7905.18', '7847.71'] },
    ];
  } else if (moduleId === '7.1') {
    caption = 'Table 1｜完整 v1.5 配对指标；v1.6 Overall 单独读取';
    ariaLabel = '论文 Table 1 的 DeepSeek-OCR 与 Unlimited OCR 完整 v1.5 配对指标，以及 Unlimited OCR 的 v1.6 Overall';
    columns = ['v1.5 Overall ↑', 'Text Edit ↓', 'Formula CDM ↑', 'Table TEDS ↑', 'TEDS-S ↑', 'Read-order Edit ↓', 'v1.6 Overall ↑'];
    rows = [
      { label: 'DeepSeek-OCR', tone: 'baseline', values: ['87.01', '0.073', '83.37', '84.97', '88.80', '0.086', '—'] },
      { label: 'Unlimited OCR', tone: 'method', values: ['93.23', '0.038', '92.61', '90.93', '94.07', '0.045', '93.92'] },
    ];
  } else if (moduleId === '8.1') {
    caption = 'Table 3｜作者自建长页集完整指标；不与 OmniDocBench 混比';
    ariaLabel = '论文 Table 3，作者自建长页集上不同页数档的 Distinct-20、Distinct-35 与编辑距离';
    columns = ['2 页', '5 页', '10 页', '15 页', '20 页', '40+ 页'];
    rows = [
      { label: 'Distinct-20 ↑', tone: 'method', values: ['99.76%', '99.78%', '97.49%', '99.92%', '98.73%', '96.08%'] },
      { label: 'Distinct-35 ↑', tone: 'method', values: ['99.87%', '99.98%', '99.83%', '99.99%', '99.89%', '96.90%'] },
      { label: 'Edit Distance ↓', tone: 'neutral', values: ['0.0362', '0.0452', '0.0526', '0.0787', '0.0572', '0.1069'] },
    ];
  } else {
    return null;
  }

  return (
    <figure className={'evidence-table-block is-' + moduleId.replace('.', '-')}>
      <figcaption>{caption}</figcaption>
      <div className="evidence-table-scroll" aria-label={ariaLabel}>
        <table className="evidence-table">
          <thead>
            <tr>
              <th scope="col">{moduleId === '8.1' ? '指标' : '模型'}</th>
              {columns.map((column, index) => (
                <th key={column} scope="col" className={index === selected ? 'is-selected' : ''}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={'is-' + row.tone}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, index) => (
                  <td key={columns[index]} className={(index === selected ? 'is-selected ' : '') + (value === '—' ? 'is-na' : '')}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export const UnlimitedInteractive: React.FC<WidgetProps> = ({ moduleId }) => {
  const spec = SPECS[moduleId] || SPECS['1.2'];
  const [primary, setPrimary] = useState(spec.defaultPrimary || 0);
  const [secondary, setSecondary] = useState(spec.defaultSecondary || 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const draw = () => {
      drawUnlimitedModule(ctx, moduleId, { primary, secondary });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      draw();
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId, primary, secondary]);

  const feedback = useMemo(() => feedbackFor(moduleId, primary, secondary), [moduleId, primary, secondary]);
  const hasEvidence = moduleId === '5.1' || moduleId === '7.1' || moduleId === '8.1';

  const primaryControls = spec.primary.length === 1 ? null : spec.primaryControl === 'range' ? (
    <div className="ctrl">
      <label>{spec.primaryLabel} <span className="val">{spec.primary[primary].label}</span></label>
      <input aria-label={spec.primaryLabel} type="range" min={0} max={spec.primary.length - 1} step={1} value={primary} onChange={(event) => setPrimary(Number(event.target.value))} />
    </div>
  ) : spec.primaryControl === 'steps' ? (
    <div className="step-ctrl">
      <button type="button" className="chip" disabled={primary === 0} onClick={() => setPrimary((value) => Math.max(0, value - 1))}>上一步</button>
      <span className="step-label">{spec.primaryLabel}：<b>{spec.primary[primary].label}</b></span>
      <button type="button" className="chip" disabled={primary === spec.primary.length - 1} onClick={() => setPrimary((value) => Math.min(spec.primary.length - 1, value + 1))}>下一步</button>
    </div>
  ) : (
    <ChoiceRow label={spec.primaryLabel} choices={spec.primary} selected={primary} onSelect={setPrimary} />
  );

  return (
    <div className={'unlimited-widget ' + (hasEvidence ? 'has-evidence' : '')}>
      <div className="unlimited-main">
        <div className="unlimited-stage">
          <canvas ref={canvasRef} width={W} height={H} aria-label={'模块 ' + moduleId + ' 的 Unlimited OCR 交互示意图'} />
        </div>
      </div>
      <div className="unlimited-side">
        <div className="unlimited-controls">
          {primaryControls}
          {spec.secondary ? <ChoiceRow label={spec.secondaryLabel || '第二组选项'} choices={spec.secondary} selected={secondary} onSelect={setSecondary} /> : null}
        </div>
        <div className={'feedback ' + feedback.cls} aria-live="polite">{feedback.text}</div>
      </div>
      {hasEvidence ? (
        <div className="unlimited-evidence-wide">
          <EvidenceTable moduleId={moduleId} selected={primary} />
        </div>
      ) : null}
    </div>
  );
};

export default UnlimitedInteractive;
