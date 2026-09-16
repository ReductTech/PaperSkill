import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

interface ModuleState {
  step: number;
  contextK: number;
  mode: 'old' | 'sqd';
  family: 'glm' | 'nemotron' | 'gemma';
  ai: number;
  running: boolean;
  progress: number;
  cacheScale: number;
  offset: number;
  node: 'gpu' | 'kv' | 'indexer' | 'asic' | 'cache' | 'ffn';
  link: 'latency' | 'bandwidth';
  latency: number;
  bandwidth: number;
  metric: 'tokensj' | 'tps' | 'power';
  dragging: boolean;
}

function initial(moduleId: string): ModuleState {
  return {
    step: 0,
    contextK: 32,
    mode: 'old',
    family: 'glm',
    ai: 2,
    running: false,
    progress: 0,
    cacheScale: 1,
    offset: moduleId === '6.2' ? 1 : 2,
    node: 'gpu',
    link: 'latency',
    latency: 2,
    bandwidth: 2.5,
    metric: 'tokensj',
    dragging: false,
  };
}

function clear(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, H - 42, W, 42);
  ctx.fillStyle = C.ink;
  ctx.font = '700 22px "Segoe UI", sans-serif';
  ctx.fillText(title, 28, 34);
  ctx.fillStyle = C.muted;
  ctx.font = '500 16px "Segoe UI", sans-serif';
  ctx.fillText(subtitle, 28, 58);
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  border = C.line,
) {
  ctx.fillStyle = C.white;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  value: number,
  color: string,
  base = C.line,
) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, 16);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, clamp(value, 0, 1) * w, 16);
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.5), y2 - 10 * Math.sin(angle - 0.5));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.5), y2 - 10 * Math.sin(angle + 0.5));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function node(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  active: boolean,
  color = C.blue,
) {
  ctx.fillStyle = active ? color : C.white;
  ctx.strokeStyle = active ? color : C.line;
  ctx.lineWidth = active ? 3 : 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = active ? C.white : C.ink;
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 5);
  ctx.textAlign = 'start';
}

function drawRider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  phase: number,
  load = 1,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  [-22, 22].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(x + dx, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x - 4, y - 17);
  ctx.lineTo(x + 17, y - 16);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x - 4, y - 17);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x + 22, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 3);
  ctx.lineTo(x + 8, y - 31);
  ctx.lineTo(x + 20, y - 23);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 8, y - 37, 7, 0, Math.PI * 2);
  ctx.fill();
  const wheelAngle = phase * Math.PI * 6;
  ctx.translate(x + 3, y);
  ctx.rotate(wheelAngle);
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = load > 1 ? C.red : C.green;
  ctx.fillRect(x - 8, y - 62, 15 + load * 5, 16 + load * 4);
  ctx.restore();
}

function renderChapter1(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '上下文压力', 'old vs SQD');
  drawRider(ctx, 150, 176, s.mode === 'sqd' ? C.green : C.red, time / 1000, s.mode === 'sqd' ? 0.8 : 1.5 + s.contextK / 500);
  panel(ctx, 360, 76, 660, 162);
  const norm = (s.contextK - 32) / 992;
  const throughputLow = 0.63;
  const throughputHigh = 0.97;
  const tokenLow = 1.12 + norm * 0.41;
  const tokenHigh = 1.51 + norm * 0.2;
  bar(ctx, 410, 112, 540, throughputHigh, C.green);
  ctx.fillStyle = C.orange;
  ctx.fillRect(410 + throughputLow * 540 - 2, 106, 4, 28);
  const tokenMax = 1.71;
  bar(ctx, 410, 164, 540, tokenHigh / tokenMax, C.green);
  ctx.fillStyle = C.orange;
  ctx.fillRect(410 + (tokenLow / tokenMax) * 540 - 2, 158, 4, 28);
  ctx.fillStyle = C.ink;
  ctx.font = '700 16px "Segoe UI", sans-serif';
  ctx.fillText('TPS', 410, 102);
  ctx.fillText('tokens/J', 410, 154);
  ctx.fillText('63-97%', 850, 128);
  ctx.fillText(`${tokenLow.toFixed(2)}-${tokenHigh.toFixed(2)}x`, 820, 188);
}

function renderChapter2(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '四阶段', 'step');
  const names = ['Prefill', 'Quadratic', 'Subquad', 'FFN'];
  const ai = [0.9, 0.24, 0.32, 0.46];
  const fp = [0.16, 0.76 + s.step * 0.04, 0.25, 0.55];
  drawRider(ctx, 145, 174, [C.blue, C.red, C.green, C.orange][s.step], time / 1000, s.step === 1 ? 2 : 1);
  panel(ctx, 330, 74, 690, 166);
  for (let i = 0; i < 4; i += 1) {
    const y = 106 + i * 31;
    ctx.fillStyle = i === s.step ? [C.blue, C.red, C.green, C.orange][i] : C.muted;
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText(names[i], 365, y + 13);
    bar(ctx, 480, y, 220, ai[i], i === s.step ? [C.blue, C.red, C.green, C.orange][i] : C.line);
    bar(ctx, 760, y, 190, fp[i], i === s.step ? (i === 1 ? C.red : C.green) : C.line);
  }
  ctx.fillStyle = C.ink;
  ctx.fillText('AI', 480, 98);
  ctx.fillText('Footprint', 760, 98);
}

function renderChapter3(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '模型边界', 'chips');
  drawRider(ctx, 120, 174, C.blue, time / 1000, 1);
  panel(ctx, 270, 72, 750, 174);
  const layouts: Record<string, { q: number; total: number; split: number }> = {
    glm: { q: 1, total: 6, split: 2 },
    nemotron: { q: 2, total: 8, split: 3 },
    gemma: { q: 3, total: 10, split: 4 },
  };
  const cfg = layouts[s.family];
  for (let i = 0; i < cfg.total; i += 1) {
    const x = 310 + i * 62;
    ctx.fillStyle = i < cfg.q ? C.red : C.green;
    ctx.fillRect(x, 128, 48, 42);
  }
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(310 + cfg.q * 62 - 5, 112);
  ctx.lineTo(310 + cfg.q * 62 - 5, 188);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillText(`${cfg.q}/${cfg.total}`, 820, 150);
}

function renderChapter4(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, 'Roofline', 'drag');
  panel(ctx, 120, 72, 860, 174);
  const x0 = 180;
  const y0 = 218;
  const x1 = 930;
  const y1 = 94;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.stroke();
  ctx.strokeStyle = C.red;
  ctx.beginPath();
  ctx.moveTo(x0 + 250, y0 - 86);
  ctx.lineTo(x0 + 250, y0);
  ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(x0 + 80, y0 - 63);
  ctx.lineTo(x0 + 80, y0);
  ctx.stroke();
  const t = clamp((Math.log10(Math.max(1, s.ai)) - Math.log10(1)) / 3, 0, 1);
  const px = x0 + 70 + t * 670;
  const py = y0 - 20 - t * 100;
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.fillText(s.ai.toFixed(1), px + 14, py - 10);
  ctx.fillStyle = C.muted;
  ctx.fillText('1', x0 + 4, y0 + 22);
  ctx.fillText('1000', x1 - 38, y0 + 22);
}

function renderChapter5(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '放置比较', 'sync');
  const p = s.running ? s.progress : 0;
  const familyCfg: Record<string, { resident: number; interval: number; label: string }> = {
    glm: { resident: 0.07, interval: 4, label: 'GLM' },
    nemotron: { resident: 0.11, interval: 9, label: 'Nemotron' },
    gemma: { resident: 0.32, interval: 6, label: 'Gemma4' },
  };
  const cfg = familyCfg[s.family];
  panel(ctx, 70, 72, 450, 176, C.red);
  panel(ctx, 560, 72, 450, 176, C.green);
  drawRider(ctx, 190, 190, C.red, time / 1000, 1 + p);
  drawRider(ctx, 680, 190, C.green, time / 1000, 0.8 + p * 0.3);
  bar(ctx, 130, 104, 330, p, C.red);
  bar(ctx, 620, 104, 330, p * (1 - cfg.resident), C.green);
  ctx.fillStyle = C.ink;
  ctx.fillText(cfg.label, 130, 98);
  ctx.fillText(`1 / ${cfg.interval}`, 620, 98);
}

function renderChapter6(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '执行路线', 'step');
  node(ctx, 100, 96, 220, 72, 'GPU', s.step >= 0, C.blue);
  node(ctx, 760, 96, 220, 72, 'ASIC', s.step >= 1, C.green);
  node(ctx, 390, 96, 130, 72, 'Link', s.step >= 2, C.purple);
  node(ctx, 570, 96, 130, 72, 'Cache', s.step >= 3, C.orange);
  arrow(ctx, 320, 132, 390, 132, s.step >= 2 ? C.purple : C.line, s.step < 2);
  arrow(ctx, 520, 132, 570, 132, s.step >= 3 ? C.orange : C.line, s.step < 3);
  arrow(ctx, 700, 132, 760, 132, s.step >= 1 ? C.green : C.line, s.step < 1);
  ctx.fillStyle = C.ink;
  ctx.fillText(['Prefill + Q', 'SubQ + FFN', 'Activation', 'SelectedKV'][s.step], 470, 215);
}

function renderChapter6b(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '通信预算', 'slack');
  const budgets = [0, 86.5, 173, 259.5];
  const budget = budgets[s.offset - 1];
  const hit = clamp((s.cacheScale - 1) / 5, 0, 1);
  const required = [1, 0.85, 0.69, 0.53][s.offset - 1];
  const exposed = s.offset === 1 ? 1 : clamp((required - hit) * 2.2 + 0.08, 0.08, 1);
  panel(ctx, 110, 78, 850, 164);
  bar(ctx, 210, 118, 600, budget / 260, C.blue);
  bar(ctx, 210, 172, 600, exposed, exposed > 0.35 ? C.red : C.green);
  ctx.fillStyle = C.ink;
  ctx.fillText('budget', 210, 108);
  ctx.fillText('exposed', 210, 162);
  ctx.fillText(`${budget.toFixed(1)}us`, 830, 132);
  ctx.fillText(`${Math.round(hit * 100)}%`, 830, 186);
  drawRider(ctx, 110, 192, C.blue, time / 1000, 1);
}

function renderChapter7(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '缓存命中', 'deadline');
  panel(ctx, 90, 72, 430, 174);
  panel(ctx, 555, 72, 430, 174);
  const hit = clamp((s.cacheScale - 1) / 5, 0, 1);
  const thresholds = [1, 0.85, 0.69, 0.53];
  const need = thresholds[s.offset - 1];
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i / 6 < hit ? C.green : C.red;
    ctx.beginPath();
    ctx.arc(145 + i * 58, 125, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 30; i += 1) {
    const x = 590 + i * 12;
    const y = 215 - Math.min(1, (i / 30) * 0.9 + hit * 0.2) * 105;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(590, 215 - need * 105);
  ctx.lineTo(950, 215 - need * 105);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.ink;
  ctx.fillText(`${Math.round(hit * 100)}%`, 870, 98);
  drawRider(ctx, 190, 192, C.blue, time / 1000, 1);
}

function renderChapter8(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '系统图', 'click');
  const active = (id: ModuleState['node']) => s.node === id;
  node(ctx, 90, 95, 190, 72, 'GPU', active('gpu') || active('kv') || active('indexer'), C.blue);
  node(ctx, 800, 95, 190, 72, 'ASIC', active('asic') || active('cache') || active('ffn'), C.green);
  node(ctx, 360, 82, 130, 48, 'KV', active('kv'), C.red);
  node(ctx, 360, 150, 130, 48, 'Indexer', active('indexer'), C.orange);
  node(ctx, 590, 82, 130, 48, 'Cache', active('cache'), C.purple);
  node(ctx, 590, 150, 130, 48, 'FFN', active('ffn'), C.green);
  arrow(ctx, 280, 132, 360, 106, active('kv') ? C.red : C.line);
  arrow(ctx, 280, 150, 360, 174, active('indexer') ? C.orange : C.line);
  arrow(ctx, 425, 130, 425, 150, active('indexer') ? C.red : C.line);
  arrow(ctx, 490, 174, 590, 106, active('cache') ? C.purple : C.line, true);
  arrow(ctx, 490, 174, 590, 174, active('ffn') ? C.green : C.line);
  arrow(ctx, 720, 106, 800, 120, active('asic') ? C.green : C.line, s.link === 'bandwidth');
  ctx.fillStyle = s.link === 'latency' ? C.green : C.purple;
  ctx.font = '700 16px "Segoe UI", sans-serif';
  ctx.fillText(s.link === 'latency' ? 'low-latency' : 'wide-bandwidth', 735, 70);
  ctx.globalAlpha = 0.45 + 0.35 * Math.sin(time / 220);
  ctx.fillStyle = C.purple;
  ctx.beginPath();
  ctx.arc(760, 132, s.link === 'latency' ? 5 : 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function renderChapter9(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '链路扫线', 'latency');
  panel(ctx, 90, 74, 430, 168);
  panel(ctx, 555, 74, 430, 168);
  drawRider(ctx, 145, 188, C.blue, time / 1000, 0.8);
  const normalized = clamp((4 - s.latency) / 3.5, 0, 1);
  for (let i = 0; i <= 30; i += 1) {
    const x = 590 + i * 12;
    const base = 1 - Math.exp(-i / 6);
    const y = 215 - base * (0.35 + normalized * 0.55) * 105;
    if (i === 0) ctx.beginPath(), ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.stroke();
  const px = 590 + normalized * 300;
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(px, 160 - normalized * 48, 10, 0, Math.PI * 2);
  ctx.fill();
  bar(ctx, 610, 198, 320, s.bandwidth / 7, C.purple);
  ctx.fillStyle = C.ink;
  ctx.fillText(`${s.latency.toFixed(1)}us`, 875, 122);
  ctx.fillText(`${s.bandwidth.toFixed(1)}TB/s`, 875, 192);
  ctx.fillText(`${Math.round(normalized * 100)}%`, 875, 86);
}

function renderChapter10(ctx: CanvasRenderingContext2D, s: ModuleState, time: number) {
  clear(ctx, '结果比较', 'metric');
  const p = s.running ? s.progress : 0;
  const modelMetrics = {
    glm: { vsNo: 1.53, vsAfd: 1.38, tpsLow: 2.9, tpsHigh: 3.6 },
    nemotron: { vsNo: 1.31, vsAfd: 1.16, tpsLow: 1.2, tpsHigh: 1.5 },
    gemma: { vsNo: 1.56, vsAfd: 1.36, tpsLow: 1.2, tpsHigh: 1.5 },
  }[s.family];
  const metrics: Record<string, { vals: number[]; colors: string[]; labels: string[] }> = {
    tokensj: {
      vals: [1, modelMetrics.vsNo, modelMetrics.vsAfd],
      colors: [C.red, C.green, C.blue],
      labels: ['No', 'SQD/No', 'SQD/AFD'],
    },
    tps: {
      vals: [1, modelMetrics.tpsLow, modelMetrics.tpsHigh],
      colors: [C.orange, C.green, C.green],
      labels: ['AFD', 'SQD low', 'SQD high'],
    },
    power: {
      vals: [7.26, 4.11],
      colors: [C.red, C.green],
      labels: ['Stock', 'SQD'],
    },
  };
  const cfg = metrics[s.metric];
  const max = Math.max(...cfg.vals);
  for (let i = 0; i < cfg.vals.length; i += 1) {
    const y = 92 + i * 42;
    bar(ctx, 260, y, 650, (cfg.vals[i] / max) * p, cfg.colors[i]);
    ctx.fillStyle = C.ink;
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText(cfg.labels[i], 180, y + 13);
    ctx.fillText((cfg.vals[i] * p).toFixed(2), 925, y + 13);
  }
  drawRider(ctx, 85, 194, C.green, time / 1000, 0.8);
}

function feedbackFor(moduleId: string, s: ModuleState): { text: string; cls: string } {
  if (moduleId === '1.1') {
    if (s.contextK >= 512 && s.mode === 'old') return { text: '论文报告上下文增长时 SQD 的能效优势扩大；1M 时相对最强 GPU-only 基线的 tokens/J 提升为 53% 到 71%。', cls: 'bad' };
    if (s.mode === 'sqd') return { text: '论文报告 SQD 保留 63% 到 97% 的 no-disaggregation 解码吞吐，并提高 tokens/J。', cls: 'good' };
    return { text: '论文报告 32K 时 tokens/J 相对最强 GPU-only 基线提升 12% 到 51%，优势随上下文增长扩大。', cls: '' };
  }
  if (moduleId === '2.1') {
    const texts = [
      'prefill 计算密集，适合高吞吐 GPU。',
      'quadratic attention 的状态随上下文增长，留在 KV 所在侧。',
      'subquadratic attention 读取固定大小状态，适合 SRAM-only 侧。',
      'FFN 权重固定，batch 提高时算术强度上升。',
    ];
    return { text: texts[s.step], cls: s.step === 1 ? 'bad' : 'good' };
  }
  if (moduleId === '3.1') {
    const texts = {
      glm: 'GLM-5.2：indexer 留在 GPU，top-k attention 与 FFN 去 ASIC。',
      nemotron: 'Nemotron 3 Ultra：12/108 dense 层留 GPU，其余 recurrent 层与 FFN 去 ASIC。',
      gemma: 'Gemma4-31B：10/60 dense 层留 GPU，50 个滑窗层与 FFN 去 ASIC。',
    };
    return { text: texts[s.family], cls: 'good' };
  }
  if (moduleId === '4.1') {
    if (s.ai < 8.2) return { text: '工作点接近 SRAM-only 岭点，适合放到高带宽片上设备。', cls: 'good' };
    if (s.ai < 758) return { text: '工作点位于中间区间，需要结合状态容量与链路成本判断。', cls: '' };
    return { text: '工作点高于 GPU 岭点，计算密集工作更适合 GPU。', cls: 'bad' };
  }
  if (moduleId === '5.1') {
    const texts = {
      glm: 'GLM-5.2 驻留增加约 7%，每 4 层 IndexShare 组跨池一次。',
      nemotron: 'Nemotron 3 Ultra 驻留增加约 11%，每 9 层跨池一次。',
      gemma: 'Gemma4 的驻留集合增长 3.9 倍，每 6 层跨池一次，容量必须先过关。',
    };
    return { text: texts[s.family], cls: s.family === 'gemma' ? 'bad' : 'good' };
  }
  if (moduleId === '6.1') {
    const texts = [
      'Prefill 与 quadratic decode 共享 GPU 和 KV。',
      'Subquadratic attention 与 FFN 在 ASIC 上执行。',
      '只搬运激活，跨池次数降到每若干层一次。',
      'Selected-KV 从缓存预取，残余 miss 才占用关键路径。',
    ];
    return { text: texts[s.step], cls: s.step >= 2 ? 'good' : '' };
  }
  if (moduleId === '6.2') {
    if (s.offset === 1) return { text: 'offset 1 自己拥有选择，没有 slack，必须承受完整往返。', cls: 'bad' };
    const need = [1, 0.85, 0.69, 0.53][s.offset - 1];
    return { text: `offset ${s.offset} 的需求命中率约为 ${Math.round(need * 100)}%，达到后可覆盖大部分通信。`, cls: s.cacheScale >= 1 + need * 3 ? 'good' : '' };
  }
  if (moduleId === '7.1') {
    const need = [1, 0.85, 0.69, 0.53][s.offset - 1];
    const hit = clamp((s.cacheScale - 1) / 5, 0, 1);
    if (s.offset === 1) return { text: 'offset 1 没有 hidden slack，缓存接近常驻才安全。', cls: 'bad' };
    return hit >= need
      ? { text: `命中率已经超过 offset ${s.offset} 的通信阈值。`, cls: 'good' }
      : { text: `命中率低于 offset ${s.offset} 的阈值，miss 会落在关键路径上。`, cls: 'bad' };
  }
  if (moduleId === '8.1') {
    const texts = {
      gpu: 'GPU 负责 prefill 与 quadratic attention，并持有完整 KV。',
      kv: 'KV 随上下文增长，不能整体搬到小 SRAM。',
      indexer: 'Indexer 扫描 full KV，因此仍留在 KV 所在侧。',
      asic: 'ASIC 执行次二次 attention 与 FFN，驻留状态固定。',
      cache: 'Cache 保存 selected-KV，跨层复用后再预取。',
      ffn: 'FFN 权重固定，适合按容量驻留在 ASIC。',
    };
    return { text: texts[s.node], cls: s.node === 'gpu' || s.node === 'kv' || s.node === 'indexer' ? '' : 'good' };
  }
  if (moduleId === '9.1') {
    if (s.latency > 3) return { text: '链路延迟过高，跨池等待直接截断吞吐。', cls: 'bad' };
    if (s.bandwidth > 5) return { text: '增加带宽只轻微改善，SQD 的传输量本来就很小。', cls: '' };
    return { text: '低延迟与足够容量是主要收益，额外带宽不是第一优先级。', cls: 'good' };
  }
  if (moduleId === '10.1') {
    const names = {
      glm: 'GLM-5.2',
      nemotron: 'Nemotron 3 Ultra',
      gemma: 'Gemma4-31B',
    };
    const ratios = {
      glm: '相对 no-disaggregation 为 1.53 倍，相对 attention-FFN 为 1.38 倍。',
      nemotron: '相对 no-disaggregation 为 1.31 倍，相对 attention-FFN 为 1.16 倍。',
      gemma: '相对 no-disaggregation 为 1.56 倍，相对 attention-FFN 为 1.36 倍。',
    };
    const texts = {
      tokensj: `${names[s.family]} tokens/J 均值${ratios[s.family]}`,
      tps: s.family === 'glm'
        ? 'GLM-5.2 的建模用户 TPS 为 attention-FFN 的 2.9 到 3.6 倍。'
        : '该模型在固定功率模型中的用户 TPS 投影为 attention-FFN 的 1.2 到 1.5 倍。',
      power: '调整代理上 SQD 约 4.11 kW，对 stock 7.26 kW；推理使用 dummy weights。',
    };
    return { text: texts[s.metric], cls: s.metric === 'power' ? '' : 'good' };
  }
  return { text: '改变控制，观察主动图形与证据同步更新。', cls: '' };
}

function titleFor(moduleId: string) {
  const titles: Record<string, string> = {
    '1.1': '压力测试',
    '2.1': '传动台',
    '3.1': '模型边界',
    '4.1': 'Roofline',
    '5.1': '放置比较',
    '6.1': '执行路线',
    '6.2': '通信预算',
    '7.1': '缓存曲线',
    '8.1': '系统结构',
    '9.1': '链路扫线',
    '10.1': '结果比赛',
  };
  return titles[moduleId] ?? '交互模块';
}

function subtitleFor(moduleId: string) {
  const subtitles: Record<string, string> = {
    '1.1': 'context / placement',
    '2.1': 'step through stages',
    '3.1': 'family boundary',
    '4.1': 'drag operating point',
    '5.1': 'synchronized comparison',
    '6.1': 'GPU to ASIC',
    '6.2': 'deadline budget',
    '7.1': 'hit rate vs threshold',
    '8.1': 'clickable system',
    '9.1': 'latency vs bandwidth',
    '10.1': 'paper metrics',
  };
  return subtitles[moduleId] ?? '';
}

export const SqdModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ModuleState>(initial(moduleId));
  const [state, setState] = useState<ModuleState>(stateRef.current);

  const update = (patch: Partial<ModuleState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  };

  useEffect(() => {
    stateRef.current = initial(moduleId);
    setState(stateRef.current);
  }, [moduleId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.running) {
        s.progress = clamp(s.progress + 0.009, 0, 1);
        if (s.progress >= 1) s.running = false;
      }
      if (moduleId === '1.1') renderChapter1(ctx, s, time);
      else if (moduleId === '2.1') renderChapter2(ctx, s, time);
      else if (moduleId === '3.1') renderChapter3(ctx, s, time);
      else if (moduleId === '4.1') renderChapter4(ctx, s, time);
      else if (moduleId === '5.1') renderChapter5(ctx, s, time);
      else if (moduleId === '6.1') renderChapter6(ctx, s, time);
      else if (moduleId === '6.2') renderChapter6b(ctx, s, time);
      else if (moduleId === '7.1') renderChapter7(ctx, s, time);
      else if (moduleId === '8.1') renderChapter8(ctx, s, time);
      else if (moduleId === '9.1') renderChapter9(ctx, s, time);
      else if (moduleId === '10.1') renderChapter10(ctx, s, time);
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  const pointerToAi = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return state.ai;
    const rect = canvas.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    return Math.pow(10, x * 3);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (moduleId !== '4.1' || !state.dragging) return;
    update({ ai: pointerToAi(event.clientX) });
  };

  const feedback = feedbackFor(moduleId, state);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={(event) => {
          if (moduleId !== '4.1') return;
          event.currentTarget.setPointerCapture(event.pointerId);
          update({ dragging: true, ai: pointerToAi(event.clientX) });
        }}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          if (moduleId !== '4.1') return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          update({ dragging: false });
        }}
        style={{ cursor: moduleId === '4.1' ? 'grab' : 'default', touchAction: moduleId === '4.1' ? 'none' : undefined }}
      />

      {moduleId === '1.1' ? (
        <div className="ctrl">
          <label>上下文 <span className="val">{Math.round(state.contextK)}K</span></label>
          <input type="range" min={32} max={1024} step={32} value={state.contextK} onChange={(e) => update({ contextK: Number(e.target.value) })} />
          <button className={`chip ${state.mode === 'old' ? 'selected' : ''}`} onClick={() => update({ mode: 'old' })}>GPU-only 定位</button>
          <button className={`chip ${state.mode === 'sqd' ? 'selected' : ''}`} onClick={() => update({ mode: 'sqd' })}>SQD 定位</button>
        </div>
      ) : null}

      {moduleId === '2.1' || moduleId === '6.1' ? (
        <div className="step-ctrl">
          <button className="tiny ghost" onClick={() => update({ step: clamp(state.step - 1, 0, 3) })}>上一步</button>
          <span className="step-label">步骤 <b>{state.step + 1}</b> / 4</span>
          <button className="tiny" onClick={() => update({ step: clamp(state.step + 1, 0, 3) })}>下一步</button>
          <button className="tiny ghost" onClick={() => update({ step: 0 })}>重置</button>
        </div>
      ) : null}

      {moduleId === '3.1' ? (
        <div className="chip-row">
          {(['glm', 'nemotron', 'gemma'] as const).map((family) => (
            <button key={family} className={`chip ${state.family === family ? 'selected' : ''}`} onClick={() => update({ family })}>
              {family === 'glm' ? 'GLM-5.2' : family === 'nemotron' ? 'Nemotron 3 Ultra' : 'Gemma4-31B'}
            </button>
          ))}
        </div>
      ) : null}

      {moduleId === '4.1' ? (
        <div className="ctrl">
          <label>工作点 AI <span className="val">{state.ai.toFixed(1)}</span></label>
          <input type="range" min={0} max={3} step={0.01} value={Math.log10(state.ai)} onChange={(e) => update({ ai: Math.pow(10, Number(e.target.value)) })} />
          <button className="chip" onClick={() => update({ ai: 2 })}>重置</button>
        </div>
      ) : null}

      {moduleId === '5.1' ? (
        <div className="ctrl">
          <button className="chip" onClick={() => update({ running: true, progress: 0 })}>开始比较</button>
          {(['glm', 'nemotron', 'gemma'] as const).map((family) => (
            <button key={family} className={`chip ${state.family === family ? 'selected' : ''}`} onClick={() => update({ family, running: true, progress: 0 })}>
              {family === 'glm' ? 'GLM' : family === 'nemotron' ? 'Nemotron' : 'Gemma4'}
            </button>
          ))}
          <button className="chip" onClick={() => update({ running: false, progress: 0 })}>重置</button>
        </div>
      ) : null}

      {moduleId === '6.2' || moduleId === '7.1' ? (
        <div className="ctrl">
          <label>缓存大小 <span className="val">{state.cacheScale.toFixed(1)}×</span></label>
          <input type="range" min={1} max={6} step={0.1} value={state.cacheScale} onChange={(e) => update({ cacheScale: Number(e.target.value) })} />
          {[1, 2, 3, 4].map((offset) => (
            <button key={offset} className={`chip ${state.offset === offset ? 'selected' : ''}`} onClick={() => update({ offset })}>offset {offset}</button>
          ))}
          <button className="chip" onClick={() => update({ cacheScale: 1, offset: moduleId === '6.2' ? 1 : 2 })}>重置</button>
        </div>
      ) : null}

      {moduleId === '8.1' ? (
        <div className="chip-row">
          {([
            ['gpu', 'GPU'],
            ['kv', 'KV'],
            ['indexer', 'Indexer'],
            ['asic', 'ASIC'],
            ['cache', 'Cache'],
            ['ffn', 'FFN'],
          ] as const).map(([nodeId, label]) => (
            <button key={nodeId} className={`chip ${state.node === nodeId ? 'selected' : ''}`} onClick={() => update({ node: nodeId })}>{label}</button>
          ))}
          <button className={`chip ${state.link === 'latency' ? 'selected' : ''}`} onClick={() => update({ link: 'latency' })}>低延迟</button>
          <button className={`chip ${state.link === 'bandwidth' ? 'selected' : ''}`} onClick={() => update({ link: 'bandwidth' })}>高带宽</button>
        </div>
      ) : null}

      {moduleId === '9.1' ? (
        <div className="ctrl">
          <label>链路延迟 <span className="val">{state.latency.toFixed(1)}μs</span></label>
          <input type="range" min={0.5} max={4} step={0.1} value={state.latency} onChange={(e) => update({ latency: Number(e.target.value) })} />
          <button className={`chip ${state.bandwidth === 2.5 ? 'selected' : ''}`} onClick={() => update({ bandwidth: 2.5 })}>2.5TB/s</button>
          <button className={`chip ${state.bandwidth === 7 ? 'selected' : ''}`} onClick={() => update({ bandwidth: 7 })}>7TB/s</button>
          <button className="chip" onClick={() => update({ latency: 2, bandwidth: 2.5 })}>重置</button>
        </div>
      ) : null}

      {moduleId === '10.1' ? (
        <div className="ctrl">
          <button className="chip" onClick={() => update({ running: true, progress: 0 })}>开始比较</button>
          {(['glm', 'nemotron', 'gemma'] as const).map((family) => (
            <button key={family} className={`chip ${state.family === family ? 'selected' : ''}`} onClick={() => update({ family, running: true, progress: 0 })}>
              {family === 'glm' ? 'GLM-5.2' : family === 'nemotron' ? 'Nemotron 3 Ultra' : 'Gemma4-31B'}
            </button>
          ))}
          {(['tokensj', 'tps', 'power'] as const).map((metric) => (
            <button key={metric} className={`chip ${state.metric === metric ? 'selected' : ''}`} onClick={() => update({ metric, running: true, progress: 0 })}>
              {metric === 'tokensj' ? 'tokens/J' : metric === 'tps' ? '用户 TPS' : '功率'}
            </button>
          ))}
          <button className="chip" onClick={() => update({ running: true, progress: 0 })}>重放</button>
        </div>
      ) : null}

      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default SqdModule;
