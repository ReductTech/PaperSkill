import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;
const HW = 520;
const HH = 210;
const AW = 244;
const AH = 130;

const C = {
  bg: '#f4f7fb',
  panel: '#ffffff',
  paleBlue: '#eef5ff',
  paleGreen: '#ecfdf5',
  paleRed: '#fff1f2',
  paleOrange: '#fff7ed',
  grid: '#e8eef6',
  steel: '#8da0b8',
  dark: '#162238',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  bench: '#c8d7b8',
};

type Mode = 'bottleneck' | 'split' | 'doe' | 'tradeoff' | 'feedback' | 'costGate' | 'boundary' | 'cases' | 'sdl' | 'wrap';

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.line, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = C.line, width = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 14, align: CanvasTextAlign = 'center', weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function scene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 22; y < h; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.fillRect(0, h - 40, w, 40);
  line(ctx, 16, h - 40, w - 16, h - 40, C.bench, 2);
}

function metricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  note: string,
  color: string,
  fill = '#fff',
) {
  roundRect(ctx, x, y, w, h, 10, fill, color, 1.6);
  label(ctx, title, x + 12, y + 15, C.muted, 10, 'left', 700);
  label(ctx, value, x + 12, y + 39, color, 24, 'left', 800);
  label(ctx, note, x + 12, y + h - 12, C.muted, 10, 'left', 600);
}

function progressBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, pct: number, color: string, bg = '#e7edf5') {
  roundRect(ctx, x, y, w, 8, 4, bg, bg, 0);
  roundRect(ctx, x, y, w * clamp(pct, 0, 1), 8, 4, color, color, 0);
}

function sparkline(ctx: CanvasRenderingContext2D, pts: number[], x: number, y: number, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const px = x + (i / (pts.length - 1)) * w;
    const py = y + h - clamp(p, 0, 1) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function gauge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pct: number, color: string, title: string, value: string) {
  ctx.strokeStyle = '#e3eaf3';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.78, Math.PI * 2.22);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.78, Math.PI * (0.78 + 1.44 * clamp(pct, 0, 1)));
  ctx.stroke();
  label(ctx, value, x, y - 2, color, 18, 'center', 800);
  label(ctx, title, x, y + 22, C.muted, 10, 'center', 700);
}

function beaker(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, color = C.blue, scale = 1) {
  const w = 30 * scale;
  const h = 58 * scale;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x - w * 0.35, y + h / 2);
  ctx.quadraticCurveTo(x, y + h * 0.62, x + w * 0.35, y + h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.stroke();
  const fillH = h * 0.68 * clamp(level, 0, 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(x - w * 0.32, y + h * 0.42 - fillH, w * 0.64, fillH);
  ctx.globalAlpha = 1;
}

function agent(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 6, y - 3, 2.6, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, x - 6, y + 8, x + 6, y + 8, '#fff', 2);
}

function target(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.green) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  line(ctx, x1, y1, x2, y2, color, 3);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.55) * 10, y2 - Math.sin(ang - 0.55) * 10);
  ctx.lineTo(x2 - Math.cos(ang + 0.55) * 10, y2 - Math.sin(ang + 0.55) * 10);
  ctx.closePath();
  ctx.fill();
}

function drawHeroOld(ctx: CanvasRenderingContext2D, t: number) {
  scene(ctx, HW, HH);
  label(ctx, 'VALIDATION LOAD', 26, 28, C.dark, 13, 'left', 800);
  label(ctx, '未压缩的真实实验闭环', 26, 50, C.muted, 12, 'left', 700);
  metricCard(ctx, 26, 72, 138, 82, 'LOOP COUNT L', '18', '轮次偏高', C.red, C.paleRed);
  metricCard(ctx, 190, 72, 138, 82, 'COST PER LOOP', '92', '单轮偏贵', C.orange, C.paleOrange);
  metricCard(ctx, 354, 72, 138, 82, 'QUEUE', 'HIGH', '验证积压', C.red, C.paleRed);
  const pulse = (Math.sin(t / 520) + 1) / 2;
  progressBar(ctx, 34, 176, 190, 0.72 + pulse * 0.18, C.red);
  progressBar(ctx, 286, 176, 190, 0.84, C.orange);
  label(ctx, 'budget burn', 34, 166, C.muted, 10, 'left', 700);
  label(ctx, 'slow gate', 286, 166, C.muted, 10, 'left', 700);
}

function drawHeroNew(ctx: CanvasRenderingContext2D, t: number) {
  scene(ctx, HW, HH);
  label(ctx, 'COMPRESSION CONTROL', 26, 28, C.dark, 13, 'left', 800);
  label(ctx, 'agent 同时压缩 L 与 C', 26, 50, C.muted, 12, 'left', 700);
  metricCard(ctx, 26, 72, 138, 82, 'L BY DOE', '7', '先验减少轮次', C.green, C.paleGreen);
  metricCard(ctx, 190, 72, 138, 82, 'C BY GATE', '38', '闸门减少真测', C.green, C.paleGreen);
  metricCard(ctx, 354, 72, 138, 82, 'VALIDATION', 'ON', '可靠性保留', C.blue, C.paleBlue);
  const pts = [0.82, 0.7, 0.58, 0.52, 0.43, 0.36, 0.3 + Math.sin(t / 900) * 0.03];
  sparkline(ctx, pts, 34, 166, 190, 22, C.green);
  progressBar(ctx, 286, 176, 190, 0.78, C.green);
  label(ctx, 'L × C falling', 34, 194, C.green, 11, 'left', 800);
  label(ctx, 'reliability', 286, 166, C.muted, 10, 'left', 700);
}

function drawAnalogy(ctx: CanvasRenderingContext2D, chapterId: string, t: number) {
  scene(ctx, AW, AH);
  const chapter = Number(chapterId.replace(/\D/g, '')) || 1;
  const p = (Math.sin(t / 650) + 1) / 2;
  if (chapter === 1) {
    for (let i = 0; i < 6; i++) beaker(ctx, 62 + i * 23, 58, 0.22 + i * 0.07, i > 3 ? C.red : C.orange, 0.5);
    label(ctx, '真实验证排队', 122, 106, C.red, 13);
    return;
  }
  if (chapter === 2) {
    target(ctx, 186, 54, C.green);
    agent(ctx, 48 + p * 80, 64, C.blue);
    arrow(ctx, 88, 64, 166, 56, C.green);
    label(ctx, '带地图选下一轮', 122, 106, C.green, 13);
    return;
  }
  if (chapter === 3) {
    agent(ctx, 52, 58, C.blue);
    roundRect(ctx, 94, 36, 58, 38, 8, C.paleBlue, C.blue);
    roundRect(ctx, 168, 36, 58, 38, 8, C.paleGreen, C.green);
    arrow(ctx, 70, 58, 94, 56, C.blue);
    arrow(ctx, 152, 56, 168, 56, C.green);
    label(ctx, '反馈改变动作', 122, 106, C.blue, 13);
    return;
  }
  if (chapter === 4) {
    roundRect(ctx, 20, 42, 52, 34, 7, C.paleOrange, C.orange, 1.5);
    label(ctx, '筛查', 46, 59, C.orange, 11, 'center', 800);
    line(ctx, 91, 34, 91, 88, C.blue, 2);
    label(ctx, 'τ', 91, 25, C.blue, 13, 'center', 800);
    arrow(ctx, 74, 59, 116, 44, C.red);
    arrow(ctx, 74, 59, 116, 76, C.green);
    roundRect(ctx, 122, 28, 86, 28, 7, C.paleRed, C.red, 1.5);
    roundRect(ctx, 122, 70, 86, 28, 7, C.paleGreen, C.green, 1.5);
    label(ctx, '高不确定真测', 165, 42, C.red, 10, 'center', 800);
    label(ctx, '低不确定预测', 165, 84, C.green, 10, 'center', 800);
    label(ctx, '筛查后按不确定性分流', 122, 113, C.blue, 12, 'center', 800);
    return;
  }
  if (chapter === 5) {
    roundRect(ctx, 26, 36, 86, 46, 8, C.paleBlue, C.blue);
    roundRect(ctx, 132, 36, 86, 46, 8, C.paleGreen, C.green);
    label(ctx, '生物 DOE', 69, 59, C.blue, 12);
    label(ctx, '材料测量', 175, 59, C.green, 12);
    label(ctx, '两个案例，同一瓶颈', 122, 106, C.ink, 13);
    return;
  }
  ['Agent', 'DOE', 'Lab', 'Measure'].forEach((s, i) => {
    const x = [54, 122, 190, 122][i];
    const y = [38, 36, 66, 84][i];
    roundRect(ctx, x - 28, y - 14, 56, 28, 7, '#fff', i === 1 ? C.green : i === 3 ? C.orange : C.blue);
    label(ctx, s, x, y, i === 1 ? C.green : i === 3 ? C.orange : C.blue, 10);
  });
  label(ctx, '闭环里压缩两处', 122, 106, C.green, 13);
}

function drawBottleneck(ctx: CanvasRenderingContext2D, speed: number, precision: number, t: number) {
  scene(ctx, W, H);
  const ideas = Math.round(5 + speed * 14);
  const loops = Math.round(4 + speed * 15);
  const cost = Math.round(24 + precision * 72);
  const load = clamp((loops * cost) / 1500, 0.2, 1);

  label(ctx, 'Validation bottleneck dashboard', 28, 26, C.dark, 18, 'left', 800);
  label(ctx, '验证负担 ≈ 实验轮数 L × 单轮成本 C', 28, 50, C.muted, 13, 'left', 700);
  metricCard(ctx, 28, 74, 112, 82, 'IDEA INFLOW', `${ideas}/min`, 'AI 候选涌入', C.blue, C.paleBlue);
  metricCard(ctx, 158, 74, 112, 82, 'LOOP COUNT L', `${loops}`, '由队列压力驱动', speed > 0.58 ? C.red : C.orange, speed > 0.58 ? C.paleRed : C.paleOrange);
  metricCard(ctx, 288, 74, 112, 82, 'COST C', `${cost}`, '由真测强度驱动', precision > 0.58 ? C.red : C.orange, precision > 0.58 ? C.paleRed : C.paleOrange);
  gauge(ctx, 474, 119, 48, load, load > 0.55 ? C.red : C.green, 'L × C', `${Math.round(load * 100)}%`);

  const baseY = 194;
  label(ctx, '候选', 28, baseY - 24, C.blue, 11, 'left', 800);
  label(ctx, '真实验证队列', 205, baseY - 24, C.orange, 11, 'left', 800);
  label(ctx, '可靠结论', 468, baseY - 24, C.green, 11, 'center', 800);
  for (let i = 0; i < Math.min(ideas, 12); i++) {
    const x = 34 + i * 12;
    const y = baseY + Math.sin(t / 360 + i) * 3;
    roundRect(ctx, x, y, 9, 17, 3, C.paleBlue, C.blue, 1);
  }
  for (let i = 0; i < 9; i++) {
    const x = 202 + i * 17;
    const stalled = i < Math.ceil(load * 8);
    roundRect(ctx, x, baseY - 2, 11, 22, 4, stalled ? C.paleRed : '#fff', stalled ? C.red : C.line, 1.4);
  }
  arrow(ctx, 170, baseY + 9, 194, baseY + 9, C.blue);
  arrow(ctx, 376, baseY + 9, 432, baseY + 9, load > 0.55 ? C.red : C.green);
  target(ctx, 468, baseY + 9, load > 0.55 ? C.red : C.green);
}

function drawDoe(ctx: CanvasRenderingContext2D, prior: boolean) {
  scene(ctx, W, H);
  const points = [
    [76, 168], [118, 90], [164, 142], [214, 174], [258, 78], [316, 132], [372, 172], [418, 88], [470, 136],
  ];
  roundRect(ctx, 36, 28, 488, 170, 12, 'rgba(255,255,255,0.78)', C.line, 1.2);
  label(ctx, prior ? 'prior-aware DOE evidence map' : 'uncompressed search map', 56, 50, prior ? C.green : C.red, 15, 'left', 800);
  label(ctx, prior ? '先验热区、历史反馈、可行性共同约束下一轮' : '候选空间被平均扫描，前几轮容易消耗在低价值区域', 56, 72, C.muted, 12, 'left', 650);
  if (prior) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.ellipse(408, 96, 92, 54, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    label(ctx, 'prior feasible zone', 408, 45, C.green, 11, 'center', 800);
  } else {
    for (let x = 72; x <= 488; x += 70) line(ctx, x, 88, x, 178, '#dfe6ef', 1);
    for (let y = 98; y <= 178; y += 28) line(ctx, 60, y, 500, y, '#dfe6ef', 1);
  }
  target(ctx, 425, 88, C.green);
  const path = prior ? [4, 7, 8] : [0, 1, 2, 5, 6, 7];
  path.forEach((idx, i) => {
    if (i === 0) return;
    const [x1, y1] = points[path[i - 1]];
    const [x2, y2] = points[idx];
    arrow(ctx, x1, y1, x2, y2, prior ? C.green : C.red);
  });
  points.forEach(([x, y], i) => {
    const chosen = path.includes(i);
    ctx.fillStyle = chosen ? (prior ? C.green : C.red) : '#fff';
    ctx.strokeStyle = chosen ? (prior ? C.green : C.red) : C.line;
    ctx.lineWidth = chosen ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, chosen ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  const bars = prior ? [0.84, 0.68, 0.5] : [0.28, 0.38, 0.44];
  ['信息量', '可行性', '接近目标'].forEach((name, i) => {
    const x = 72 + i * 144;
    label(ctx, name, x, 218, C.muted, 11, 'left', 700);
    progressBar(ctx, x + 52, 214, 72, bars[i], prior ? C.green : C.red);
  });
  roundRect(ctx, 408, 204, 96, 28, 7, prior ? C.paleGreen : C.paleRed, prior ? C.green : C.red);
  label(ctx, prior ? '3 steps' : '6 steps', 456, 218, prior ? C.green : C.red, 13, 'center', 800);
}

function drawSplit(ctx: CanvasRenderingContext2D, active: number) {
  scene(ctx, W, H);
  const items = [
    ['L: 实验轮数', 'prior-aware DOE', '少做低价值轮次', C.green, 112],
    ['C: 单轮成本', 'cost-aware surrogate', '少做不必要贵测量', C.orange, 344],
  ] as const;
  items.forEach(([title, method, desc, color, x], i) => {
    roundRect(ctx, x - 92, 62, 184, 104, 14, i === active ? C.paleGreen : '#fff', i === active ? color : C.line, i === active ? 3 : 1.5);
    label(ctx, title, x, 90, color, 17);
    label(ctx, method, x, 122, C.blue, 13);
    label(ctx, desc, x, 148, C.muted, 12);
  });
  roundRect(ctx, 190, 188, 180, 34, 8, '#fff', C.blue);
  label(ctx, '验证负担 ≈ L × C', 280, 205, C.blue, 17);
  label(ctx, active === 0 ? '第一处压缩：让闭环少绕路。' : '第二处压缩：让每轮少花钱。', W / 2, 34, active === 0 ? C.green : C.orange, 15);
}

function drawTradeoff(ctx: CanvasRenderingContext2D, explore: number) {
  scene(ctx, W, H);
  const candidates = [
    [110, 150, 0.82, 0.2],
    [190, 92, 0.68, 0.55],
    [278, 152, 0.55, 0.82],
    [370, 88, 0.72, 0.35],
    [448, 142, 0.6, 0.72],
  ];
  let best = 0;
  let bestScore = -Infinity;
  candidates.forEach(([, , promise, unknown], i) => {
    const score = promise * (1 - explore) + unknown * explore;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  roundRect(ctx, 38, 28, 484, 170, 12, 'rgba(255,255,255,0.78)', C.line, 1.2);
  label(ctx, 'Bayesian optimization acquisition panel', 56, 50, C.blue, 15, 'left', 800);
  label(ctx, '不是只选当前最优，而是在希望值与信息增益之间调权', 56, 72, C.muted, 12, 'left', 650);
  candidates.forEach(([x, y, promise, unknown], i) => {
    const chosen = i === best;
    ctx.fillStyle = chosen ? C.green : '#fff';
    ctx.strokeStyle = chosen ? C.green : C.line;
    ctx.lineWidth = chosen ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, `${Math.round(promise * 9)}/${Math.round(unknown * 9)}`, x, y - 24, chosen ? C.green : C.muted, 11, 'center', chosen ? 800 : 650);
  });
  roundRect(ctx, 58, 204, 204, 28, 7, explore < 0.45 ? C.paleGreen : '#fff', explore < 0.45 ? C.green : C.line);
  roundRect(ctx, 298, 204, 204, 28, 7, explore >= 0.45 ? C.paleGreen : '#fff', explore >= 0.45 ? C.green : C.line);
  label(ctx, '利用：当前更有希望', 160, 218, explore < 0.45 ? C.green : C.muted, 12, 'center', 800);
  label(ctx, '探索：更有信息增益', 400, 218, explore >= 0.45 ? C.green : C.muted, 12, 'center', 800);
}

function drawFeedback(ctx: CanvasRenderingContext2D, structured: boolean) {
  scene(ctx, W, H);
  const labels = structured ? ['LLM 方向', 'Surrogate 学反馈', 'Verifier 查可行', '下一轮 DOE'] : ['LLM 方向', '聊天历史', '弱反馈', '下一轮近似不变'];
  labels.forEach((text, i) => {
    const x = 74 + i * 136;
    roundRect(ctx, x - 54, 88, 108, 54, 9, '#fff', structured || i === 0 ? C.blue : C.red, 2);
    label(ctx, text, x, 115, structured || i === 0 ? C.blue : C.red, 13);
    if (i < labels.length - 1) arrow(ctx, x + 55, 115, x + 80, 115, structured ? C.green : C.red);
  });
  const pathColor = structured ? C.green : C.red;
  const start = [96, 174];
  const mid = structured ? [280, 148] : [238, 176];
  const end = structured ? [444, 132] : [396, 174];
  line(ctx, start[0], start[1], mid[0], mid[1], pathColor, 3);
  line(ctx, mid[0], mid[1], end[0], end[1], pathColor, 3);
  [start, mid, end].forEach(([x, y], i) => {
    ctx.fillStyle = i === 2 ? pathColor : '#fff';
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, i === 2 ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  roundRect(ctx, 96, 30, 368, 36, 10, structured ? C.paleGreen : C.paleRed, structured ? C.green : C.red);
  label(ctx, structured ? '反馈进入可检查模型，下一轮会改变' : '反馈只像文本注释，闭环可能只是形式', W / 2, 48, structured ? C.green : C.red, 15);
  label(ctx, structured ? '实验反馈让下一轮候选轨迹发生偏转。' : '候选轨迹几乎不变，闭环没有真正学习。', W / 2, 214, pathColor, 15);
}

function drawBoundary(ctx: CanvasRenderingContext2D, correlated: boolean) {
  scene(ctx, W, H);
  label(ctx, 'surrogate validity check', 34, 30, correlated ? C.green : C.red, 17, 'left', 800);
  label(ctx, correlated ? '低成本信号携带目标信息，预测可以进入验证预算' : '隐藏因素主导目标，便宜信号会给出错误安全感', 34, 54, C.muted, 13, 'left', 650);
  roundRect(ctx, 46, 86, 112, 88, 12, C.paleOrange, C.orange, 1.6);
  roundRect(ctx, 224, 86, 112, 88, 12, correlated ? C.paleGreen : C.paleRed, correlated ? C.green : C.red, 1.6);
  roundRect(ctx, 402, 86, 112, 88, 12, '#fff', correlated ? C.green : C.red, 1.6);
  label(ctx, '低成本信号', 102, 112, C.orange, 14, 'center', 800);
  sparkline(ctx, correlated ? [0.2, 0.32, 0.46, 0.61, 0.76] : [0.7, 0.25, 0.62, 0.31, 0.54], 68, 132, 68, 24, C.orange);
  label(ctx, 'surrogate', 280, 112, correlated ? C.green : C.red, 14, 'center', 800);
  gauge(ctx, 280, 143, 20, correlated ? 0.78 : 0.32, correlated ? C.green : C.red, 'match', correlated ? '高' : '低');
  label(ctx, correlated ? '可省一部分真测' : '回到高成本验证', 458, 123, correlated ? C.green : C.red, 14, 'center', 800);
  progressBar(ctx, 424, 148, 68, correlated ? 0.42 : 0.9, correlated ? C.green : C.red);
  arrow(ctx, 164, 130, 218, 130, C.blue);
  arrow(ctx, 342, 130, 396, 130, correlated ? C.green : C.red);
  label(ctx, correlated ? '条件成立' : '条件不成立', W / 2, 216, correlated ? C.green : C.red, 16, 'center', 800);
}

function drawCostGate(ctx: CanvasRenderingContext2D, strictness: number) {
  scene(ctx, W, H);
  const uncertainties = [0.18, 0.74, 0.42, 0.88, 0.31, 0.66, 0.55, 0.25, 0.79, 0.47];
  const threshold = 0.82 - strictness * 0.5;
  const gatedHigh = uncertainties.filter((u) => u >= threshold).length;
  const gatedLow = uncertainties.length - gatedHigh;
  const fullCost = uncertainties.length * 10;
  const gatedCost = gatedHigh * 10 + gatedLow * 2;

  label(ctx, 'cost-aware validation gate', 34, 28, C.dark, 17, 'left', 800);
  label(ctx, '同一批候选：上方全部真测；下方先看不确定性，再决定是否真测', 34, 52, C.muted, 13, 'left', 650);

  roundRect(ctx, 394, 20, 64, 36, 8, C.paleRed, C.red, 1.4);
  label(ctx, `${fullCost}`, 426, 35, C.red, 18, 'center', 800);
  label(ctx, '全部真测成本', 426, 52, C.muted, 9, 'center', 700);
  roundRect(ctx, 468, 20, 64, 36, 8, C.paleGreen, C.green, 1.4);
  label(ctx, `${gatedCost}`, 500, 35, C.green, 18, 'center', 800);
  label(ctx, '闸门后成本', 500, 52, C.muted, 9, 'center', 700);

  label(ctx, '全部真测', 46, 88, C.red, 12, 'left', 800);
  label(ctx, '闸门分流', 46, 168, C.green, 12, 'left', 800);
  line(ctx, 150, 158 - threshold * 54, 500, 158 - threshold * 54, C.blue, 2);
  label(ctx, `τ=${threshold.toFixed(2)}`, 510, 158 - threshold * 54, C.blue, 11, 'left', 800);

  for (let i = 0; i < 10; i++) {
    const x = 92 + i * 43;
    const u = uncertainties[i];
    const isHigh = u >= threshold;
    roundRect(ctx, x - 14, 78, 28, 42, 7, C.paleRed, C.red, 1.2);
    label(ctx, '真测', x, 99, C.red, 9, 'center', 800);

    const y = 158 - u * 54;
    ctx.fillStyle = isHigh ? C.red : C.green;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    line(ctx, x, y + 10, x, isHigh ? 194 : 222, isHigh ? C.red : C.green, 1.5);
    label(ctx, isHigh ? '真测' : '预测', x, isHigh ? 206 : 234, isHigh ? C.red : C.green, 9, 'center', 800);
  }
  roundRect(ctx, 168, 198, 124, 22, 6, C.paleRed, C.red, 1.2);
  label(ctx, `高不确定真测 × ${gatedHigh}`, 230, 209, C.red, 11, 'center', 800);
  roundRect(ctx, 312, 224, 124, 22, 6, C.paleGreen, C.green, 1.2);
  label(ctx, `低不确定预测 × ${gatedLow}`, 374, 235, C.green, 11, 'center', 800);
}

function drawCases(ctx: CanvasRenderingContext2D, selected: number) {
  scene(ctx, W, H);
  const cards = [
    ['抗体工艺 DOE', '减少 trials-to-target', '喂料、pH、温度等条件要更快靠近目标', C.blue, C.paleBlue],
    ['金属增材制造', '减少昂贵表征', '硬度、XRD、成分等低成本信号约束高成本目标', C.green, C.paleGreen],
  ] as const;
  cards.forEach(([title, goal, desc, color, fill], i) => {
    const x = i === 0 ? 40 : 298;
    roundRect(ctx, x, 50, 222, 122, 12, selected === i ? fill : '#fff', selected === i ? color : C.line, selected === i ? 3 : 1.5);
    label(ctx, title, x + 111, 78, color, 16);
    label(ctx, goal, x + 111, 111, color, 14);
    label(ctx, desc, x + 111, 143, C.muted, 11);
  });
  label(ctx, selected === 0 ? '这里看第一处压缩：少跑无效实验轮次。' : '这里看第二处压缩：少做不必要的贵测量。', W / 2, 212, selected === 0 ? C.blue : C.green, 16);
}

function drawSdl(ctx: CanvasRenderingContext2D, active: number) {
  scene(ctx, W, H);
  const nodes = [
    ['Agent', 280, 45],
    ['DOE', 430, 94],
    ['Lab', 376, 178],
    ['Measure', 184, 178],
    ['Analyze', 130, 94],
  ] as const;
  nodes.forEach(([text, x, y], i) => {
    const color = i === active ? C.orange : i === 1 ? C.green : i === 3 ? C.red : C.blue;
    roundRect(ctx, x - 48, y - 20, 96, 40, 9, i === active ? '#fff7ed' : '#fff', color, i === active ? 3 : 1.5);
    label(ctx, text, x, y, color, 14);
  });
  arrow(ctx, 328, 52, 392, 83, C.blue);
  arrow(ctx, 430, 116, 390, 160, C.blue);
  arrow(ctx, 330, 178, 230, 178, C.blue);
  arrow(ctx, 170, 160, 132, 116, C.blue);
  arrow(ctx, 162, 83, 234, 52, C.blue);
  roundRect(ctx, 342, 22, 174, 28, 7, C.paleGreen, C.green);
  label(ctx, 'prior-aware DOE: 减少 L', 429, 36, C.green, 12, 'center', 800);
  roundRect(ctx, 42, 198, 220, 28, 7, C.paleRed, C.red);
  label(ctx, 'cost-aware surrogate: 降低 C', 152, 212, C.red, 12, 'center', 800);
  roundRect(ctx, 316, 198, 166, 28, 7, C.paleBlue, C.blue);
  label(ctx, '结果回流: 保持可靠', 399, 212, C.blue, 12, 'center', 800);
  label(ctx, 'agentic SDL control loop', W / 2, 18, C.dark, 16, 'center', 800);
}

function drawWrap(ctx: CanvasRenderingContext2D, active: number) {
  scene(ctx, W, H);
  const rows = [
    ['问题', 'AI 想得快，但真实验证慢。', C.red],
    ['方法', 'DOE 减少 L，surrogate 降低 C。', C.blue],
    ['价值', '更快、更省，同时保留可靠验证。', C.green],
  ] as const;
  rows.forEach(([k, v, color], i) => {
    const y = 55 + i * 58;
    roundRect(ctx, 64, y - 21, 96, 42, 9, i === active ? color : '#fff', i === active ? color : C.line, 2);
    label(ctx, k, 112, y, i === active ? '#fff' : color, 15);
    roundRect(ctx, 186, y - 21, 310, 42, 9, i === active ? C.paleGreen : '#fff', i === active ? color : C.line, 2);
    label(ctx, v, 341, y, C.ink, 14);
  });
  label(ctx, '关键不是术语表，而是这条因果链。', W / 2, 218, C.blue, 14);
}

function drawMain(ctx: CanvasRenderingContext2D, mode: Mode, state: number, option: number, aux: number, t: number) {
  if (mode === 'bottleneck') drawBottleneck(ctx, state, aux, t);
  if (mode === 'split') drawSplit(ctx, option);
  if (mode === 'doe') drawDoe(ctx, option === 1);
  if (mode === 'tradeoff') drawTradeoff(ctx, state);
  if (mode === 'feedback') drawFeedback(ctx, option === 1);
  if (mode === 'costGate') drawCostGate(ctx, state);
  if (mode === 'boundary') drawBoundary(ctx, option === 1);
  if (mode === 'cases') drawCases(ctx, option);
  if (mode === 'sdl') drawSdl(ctx, option);
  if (mode === 'wrap') drawWrap(ctx, option);
}

function useCanvas(mode: Mode, state: number, option: number, aux: number, variant: 'old' | 'new' | 'ana' | 'main', chapterId: string) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const stateRef = useRef({ state, option, aux });
  stateRef.current = { state, option, aux };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const small = variant !== 'main';
    const canvasW = variant === 'old' || variant === 'new' ? HW : small ? AW : W;
    const canvasH = variant === 'old' || variant === 'new' ? HH : small ? AH : H;
    const ctx = setupCanvas(canvas, canvasW, canvasH);
    if (variant === 'old' || variant === 'new') {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    } else if (variant === 'ana') {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    }
    const tick = (time: number) => {
      const current = stateRef.current;
      if (variant === 'old') drawHeroOld(ctx, time);
      else if (variant === 'new') drawHeroNew(ctx, time);
      else if (variant === 'ana') drawAnalogy(ctx, chapterId, time);
      else drawMain(ctx, mode, current.state, current.option, current.aux, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId, mode, variant]);

  return ref;
}

const moduleMode: Record<string, Mode> = {
  '1.1': 'bottleneck',
  '1.2': 'split',
  '2.1': 'doe',
  '2.2': 'tradeoff',
  '3.1': 'feedback',
  '4.1': 'costGate',
  '4.2': 'boundary',
  '5.1': 'cases',
  '6.1': 'sdl',
  '6.2': 'wrap',
};

export const LabWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const variant = moduleId === 'old' ? 'old' : moduleId === 'new' ? 'new' : moduleId === 'ana' ? 'ana' : 'main';
  const mode = moduleMode[moduleId] || 'bottleneck';
  const canDemo = mode === 'bottleneck' || mode === 'sdl';
  const [state, setState] = useState(mode === 'costGate' ? 0.55 : 0.52);
  const [aux, setAux] = useState(0.55);
  const [option, setOption] = useState(mode === 'cases' ? 0 : mode === 'sdl' ? 1 : 1);
  const [isDemo, setIsDemo] = useState(false);
  const ref = useCanvas(mode, state, option, aux, variant, chapterId);

  useEffect(() => {
    setIsDemo(false);
    setState(mode === 'costGate' ? 0.55 : 0.52);
    setAux(0.55);
    setOption(mode === 'cases' ? 0 : mode === 'sdl' ? 1 : 1);
  }, [mode]);

  useEffect(() => {
    if (!isDemo || variant !== 'main' || !canDemo) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const phase = (elapsed % 5200) / 5200;
      const wave = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;

      if (mode === 'bottleneck') {
        setState(0.18 + wave * 0.76);
        setAux(0.22 + ((phase + 0.33) % 1) * 0.66);
        return;
      }
      if (mode === 'sdl') {
        setOption([0, 1, 2, 3, 4][Math.floor(phase * 5)] ?? 0);
        return;
      }
    }, 140);

    return () => window.clearInterval(timer);
  }, [canDemo, isDemo, mode, variant]);

  const stopDemo = () => setIsDemo(false);
  const setManualState = (value: number) => {
    stopDemo();
    setState(value);
  };
  const setManualAux = (value: number) => {
    stopDemo();
    setAux(value);
  };
  const setManualOption = (value: number) => {
    stopDemo();
    setOption(value);
  };

  const feedback = useMemo(() => {
    if (variant !== 'main') return null;
    if (mode === 'bottleneck') {
      return state > 0.62
        ? ['bad', '候选越多，真实实验和高成本测量越容易成为整条科研流程的慢点。']
        : ['', '拖动两个滑块，先把论文问题看成 L 和 C 两个不同的可压缩位置。'];
    }
    if (mode === 'split') {
      return option === 0
        ? ['', 'L 对应实验闭环轮数，prior-aware DOE 的目标是让每一轮更值得做。']
        : ['', 'C 对应每轮验证成本，cost-aware surrogate 的目标是减少不必要的高成本测量。'];
    }
    if (mode === 'doe') {
      return option === 1
        ? ['good', 'prior-aware DOE 把先验、历史反馈和可行性放进下一轮选择，目标是减少 trials-to-target。']
        : ['bad', '随机/网格策略的问题不是不能探索，而是容易把昂贵轮次花在低价值区域。'];
    }
    if (mode === 'tradeoff') {
      return ['', 'BO 视角下，下一轮实验不是只追当前最优，也要考虑哪些区域还不确定、值得获得信息。'];
    }
    if (mode === 'feedback') {
      return option === 1
        ? ['good', '反馈进入 surrogate 与 verifier，下一轮候选会被真实结果和可行性共同约束。']
        : ['bad', '如果反馈只是聊天记录，agent 可能看起来在闭环，实际没有学到实验结果。'];
    }
    if (mode === 'costGate') {
      return option === 1
        ? ['good', '不确定性闸门把高成本测量留给关键候选：低不确定用预测，高不确定才真测。']
        : ['bad', '全部真测最稳，但每轮都贵，会让 SDL 被测量吞吐量卡住。'];
    }
    if (mode === 'boundary') {
      return option === 1
        ? ['good', '当低成本信号和高成本目标确实相关，surrogate 才能帮忙省测量。']
        : ['bad', '当隐藏因素主导结果，便宜信号会误导判断，必须回到真实高成本验证。'];
    }
    if (mode === 'cases') {
      return option === 0
        ? ['', '抗体工艺案例帮助理解第一处压缩：更快找到可行且接近目标的实验条件。']
        : ['', '材料案例帮助理解第二处压缩：只有便宜信号足够可靠时，才替代昂贵表征。'];
    }
    if (mode === 'sdl') return ['', '点击闭环环节：DOE 处减少 L，Measure 处降低 C，结果回流才让系统真正 self-driving。'];
    return ['', '把问题、方法、价值连成一句话，就能抓住这篇论文的核心。'];
  }, [mode, option, state, variant]);

  if (variant !== 'main') {
    return <canvas ref={ref} width={AW} height={AH} aria-label="论文类比动画" />;
  }

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="论文机制交互图" />
      {mode === 'bottleneck' ? (
        <>
          <div className="ctrl">
            <label>
              候选想法涌入速度
              <span className="val">{state.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={100} value={Math.round(state * 100)} onChange={(e) => setManualState(Number(e.target.value) / 100)} />
          </div>
          <div className="ctrl">
            <label>
              真实测量强度
              <span className="val">{aux.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={100} value={Math.round(aux * 100)} onChange={(e) => setManualAux(Number(e.target.value) / 100)} />
          </div>
        </>
      ) : null}
      {mode === 'split' ? (
        <div className="chip-row">
          <button className={`chip ${option === 0 ? 'selected' : ''}`} onClick={() => setManualOption(0)}>L: 实验轮数</button>
          <button className={`chip ${option === 1 ? 'selected' : ''}`} onClick={() => setManualOption(1)}>C: 单轮成本</button>
        </div>
      ) : null}
      {mode === 'doe' ? (
        <div className="chip-row">
          <button className={`chip ${option === 0 ? 'selected' : ''}`} onClick={() => setManualOption(0)}>随机/网格</button>
          <button className={`chip ${option === 1 ? 'selected' : ''}`} onClick={() => setManualOption(1)}>prior-aware DOE</button>
        </div>
      ) : null}
      {mode === 'tradeoff' ? (
        <div className="ctrl">
          <label>
            探索倾向
            <span className="val">{state.toFixed(2)}</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(state * 100)} onChange={(e) => setManualState(Number(e.target.value) / 100)} />
        </div>
      ) : null}
      {mode === 'feedback' ? (
        <div className="chip-row">
          <button className={`chip ${option === 0 ? 'selected' : ''}`} onClick={() => setManualOption(0)}>只进聊天历史</button>
          <button className={`chip ${option === 1 ? 'selected' : ''}`} onClick={() => setManualOption(1)}>surrogate + verifier</button>
        </div>
      ) : null}
      {mode === 'costGate' ? (
        <div className="ctrl">
          <label>
            不确定性阈值
            <span className="val">{(0.82 - state * 0.5).toFixed(2)}</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(state * 100)} onChange={(e) => setManualState(Number(e.target.value) / 100)} />
        </div>
      ) : null}
      {mode === 'boundary' ? (
        <div className="chip-row">
          <button className={`chip ${option === 0 ? 'selected' : ''}`} onClick={() => setManualOption(0)}>隐藏因素主导</button>
          <button className={`chip ${option === 1 ? 'selected' : ''}`} onClick={() => setManualOption(1)}>信号相关</button>
        </div>
      ) : null}
      {mode === 'cases' ? (
        <div className="chip-row">
          <button className={`chip ${option === 0 ? 'selected' : ''}`} onClick={() => setManualOption(0)}>抗体工艺 DOE</button>
          <button className={`chip ${option === 1 ? 'selected' : ''}`} onClick={() => setManualOption(1)}>金属增材测量</button>
        </div>
      ) : null}
      {mode === 'sdl' ? (
        <div className="chip-row">
          {['Agent', 'DOE', 'Lab', 'Measure', 'Analyze'].map((item, idx) => (
            <button key={item} className={`chip ${option === idx ? 'selected' : ''}`} onClick={() => setManualOption(idx)}>{item}</button>
          ))}
        </div>
      ) : null}
      {mode === 'wrap' ? (
        <div className="chip-row">
          {['问题', '方法', '价值'].map((item, idx) => (
            <button key={item} className={`chip ${option === idx ? 'selected' : ''}`} onClick={() => setManualOption(idx)}>{item}</button>
          ))}
        </div>
      ) : null}
      {canDemo ? (
        <div className="demo-row">
          <button className={`demo-btn ${isDemo ? 'selected' : ''}`} onClick={() => setIsDemo((v) => !v)}>
            {isDemo ? '停止演示' : '播放演示'}
          </button>
        </div>
      ) : null}
      {feedback ? <div className={`feedback ${feedback[0]}`}>{feedback[1]}</div> : null}
    </div>
  );
};

export default LabWidget;
