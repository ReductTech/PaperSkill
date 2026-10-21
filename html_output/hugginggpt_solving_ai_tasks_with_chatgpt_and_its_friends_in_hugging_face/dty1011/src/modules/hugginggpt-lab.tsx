import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, easeOutCubic, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  bg2: '#eef4e8',
  env: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  paper: '#ffffff',
};

type S = { value: number; mode: string; step: number; started: boolean; drag: number };

const W = 1080;
const H = 280;
const AW = 560;
const AH = 140;
const HW = 520;
const HH = 220;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 12) {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.line, width = 2, r = 12) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  rr(ctx, x, y, w, h, r);
  ctx.stroke();
}

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 17,
  color = C.ink,
  align: CanvasTextAlign = 'left',
  weight = 600
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function softShadow(ctx: CanvasRenderingContext2D, blur = 18, color = 'rgba(33,50,74,0.14)') {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = 8;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C.bg);
  g.addColorStop(1, C.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const floor = Math.max(32, h * 0.22);
  ctx.fillStyle = 'rgba(184,201,167,0.35)';
  ctx.fillRect(0, h - floor, w, floor);
  ctx.strokeStyle = 'rgba(118,144,106,0.18)';
  ctx.lineWidth = 1;
  for (let x = 36; x < w; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, h - Math.max(30, h * 0.19));
    ctx.lineTo(x + 28, h);
    ctx.stroke();
  }
}

function camera(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, scale = 1, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  softShadow(ctx, 14);
  fillRound(ctx, -36, -23, 72, 46, color, 10);
  ctx.shadowColor = 'transparent';
  fillRound(ctx, -24, -32, 28, 14, color, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-28, -17, 56, 8);
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.arc(2, 1, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.22)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(2, 1, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-3, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function photo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.blue, fill = 'rgba(39,68,110,0.08)') {
  softShadow(ctx, 10, 'rgba(33,50,74,0.1)');
  fillRound(ctx, x, y, w, h, C.paper, 10);
  ctx.shadowColor = 'transparent';
  fillRound(ctx, x + 9, y + 9, w - 18, h - 28, fill, 8);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, w = 78) {
  fillRound(ctx, x, y, w, 28, 'rgba(255,255,255,0.88)', 14);
  strokeRound(ctx, x, y, w, 28, color, 2, 14);
  label(ctx, value, x + w / 2, y + 15, 14, color, 'center', 700);
}

function connector(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue, width = 4, progress = 1) {
  const endX = x1 + (x2 - x1) * progress;
  const endY = y1 + (y2 - y1) * progress;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawStageNodes(ctx: CanvasRenderingContext2D, labels: string[], active: number, x = 96, y = 138, gap = 214, width = 124) {
  labels.forEach((item, i) => {
    const cx = x + i * gap;
    if (i > 0) connector(ctx, cx - gap + width / 2 + 10, y, cx - width / 2 - 10, y, i <= active ? C.blue : C.line, i <= active ? 5 : 3);
    const done = i < active;
    const current = i === active;
    const fill = done ? C.green : current ? C.blue : C.paper;
    softShadow(ctx, current ? 18 : 8, current ? 'rgba(39,68,110,0.2)' : 'rgba(33,50,74,0.08)');
    fillRound(ctx, cx - width / 2, y - 34, width, 68, fill, 16);
    ctx.shadowColor = 'transparent';
    strokeRound(ctx, cx - width / 2, y - 34, width, 68, current ? C.orange : C.line, current ? 3 : 2, 16);
    label(ctx, item, cx, y, 17, done || current ? '#fff' : C.ink, 'center', 700);
  });
}

function drawBars(ctx: CanvasRenderingContext2D, items: { label: string; value: number; color: string }[], x: number, y: number, w: number, row = 44) {
  items.forEach((item, i) => {
    const yy = y + i * row;
    label(ctx, item.label, x, yy + 14, 15, C.ink, 'left', 650);
    fillRound(ctx, x + 116, yy, w, 26, 'rgba(255,255,255,0.82)', 8);
    strokeRound(ctx, x + 116, yy, w, 26, C.line, 1.5, 8);
    const bw = clamp(item.value, 0, 1) * w;
    fillRound(ctx, x + 116, yy, bw, 26, item.color, 8);
    const tx = clamp(x + 126 + bw, x + 142, x + 116 + w - 22);
    label(ctx, String(Math.round(item.value * 100)), tx, yy + 14, 13, bw > 42 ? '#fff' : C.ink, 'center', 700);
  });
}

function drawViewfinder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.orange) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  const l = 18;
  ctx.beginPath();
  ctx.moveTo(x, y + l); ctx.lineTo(x, y); ctx.lineTo(x + l, y);
  ctx.moveTo(x + w - l, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + l);
  ctx.moveTo(x + w, y + h - l); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - l, y + h);
  ctx.moveTo(x + l, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - l);
  ctx.stroke();
}

function renderAnalogy(ctx: CanvasRenderingContext2D, chapterId: string, time: number) {
  clearScene(ctx, AW, AH);
  const raw = (Math.sin(time / 620) + 1) / 2;
  const t = easeInOutQuad(raw);
  const c = chapterId.replace('chap-', '');
  camera(ctx, 70 + t * 46, 86, C.blue, 0.72, -0.03 + t * 0.06);
  connector(ctx, 136, 92, 500, 92, 'rgba(146,64,14,0.78)', 4);

  if (c === '1') {
    photo(ctx, 365, 34, 86, 72, C.red, 'rgba(196,63,82,0.08)');
    fillRound(ctx, 392, 52, 32, 22, C.paper, 5);
    label(ctx, 'TXT', 408, 64, 13, C.red, 'center', 800);
    drawViewfinder(ctx, 360, 29, 96, 82, C.red);
  } else if (c === '2') {
    photo(ctx, 360, 32, 98, 76, C.green, 'rgba(34,141,92,0.08)');
    ['任务', '领域', '输入'].forEach((v, i) => pill(ctx, v, 372, 44 + i * 18, i === Math.floor(t * 3) ? C.green : C.muted, 54));
  } else if (c === '3') {
    drawStageNodes(ctx, ['姿态', '新图', '配音'], Math.min(2, Math.floor(t * 3)), 230, 78, 108, 80);
  } else if (c === '4') {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(178, 108);
    ctx.quadraticCurveTo(310, 20, 470, 82);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(178, 108);
    ctx.quadraticCurveTo(310, 20, 178 + (470 - 178) * t, 108 + (82 - 108) * t - Math.sin(t * Math.PI) * 78);
    ctx.stroke();
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(470, 82, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (c === '5') {
    ['广角', '长焦', '微距'].forEach((v, i) => {
      const active = i === Math.floor(t * 3);
      photo(ctx, 238 + i * 82, 38, 60, 56, active ? C.green : C.line, active ? 'rgba(34,141,92,0.1)' : 'rgba(255,255,255,0.6)');
      label(ctx, v, 268 + i * 82, 112, 13, active ? C.green : C.muted, 'center', 700);
    });
  } else if (c === '6') {
    photo(ctx, 188 + t * 230, 42, 78, 58, C.orange, 'rgba(240,126,71,0.1)');
    pill(ctx, '资源', 200 + t * 230, 107, C.orange, 58);
  } else if (c === '7') {
    [0, 1, 2, 3].forEach((i) => {
      photo(ctx, 188 + i * 66, 40, 48, 48, i <= Math.floor(t * 4) ? C.green : C.line, i <= Math.floor(t * 4) ? 'rgba(34,141,92,0.1)' : 'rgba(255,255,255,0.62)');
    });
  } else if (c === '8') {
    const beamX = 228 + t * 254;
    fillRound(ctx, 210, 34, 292, 82, 'rgba(255,255,255,0.72)', 14);
    ['计划', '选模', '执行', '回答'].forEach((v, i) => pill(ctx, v, 226 + i * 66, 60, i === Math.floor(t * 4) ? C.blue : C.muted, 54));
    ctx.fillStyle = 'rgba(240,126,71,0.18)';
    ctx.beginPath();
    ctx.moveTo(beamX, 20);
    ctx.lineTo(beamX - 32, 116);
    ctx.lineTo(beamX + 32, 116);
    ctx.closePath();
    ctx.fill();
  } else if (c === '9') {
    photo(ctx, 360, 34, 96, 74, raw > 0.55 ? C.red : C.green, raw > 0.55 ? 'rgba(196,63,82,0.1)' : 'rgba(34,141,92,0.1)');
    pill(ctx, raw > 0.55 ? '风险' : '通过', 379, 112, raw > 0.55 ? C.red : C.green, 58);
  } else {
    drawBars(ctx, [{ label: 'GPT', value: t, color: C.green }, { label: '开源', value: t * 0.58, color: C.blue }], 178, 45, 192, 35);
  }
}

function renderHero(ctx: CanvasRenderingContext2D, moduleId: string, time: number) {
  clearScene(ctx, HW, HH);
  const t = easeInOutQuad((Math.sin(time / 760) + 1) / 2);
  if (moduleId === 'old') {
    camera(ctx, 82, 112, C.red, 1.05);
    photo(ctx, 190, 58, 232, 104, C.red, 'rgba(196,63,82,0.08)');
    label(ctx, 'Text-only LLM', 306, 96, 22, C.red, 'center', 800);
    fillRound(ctx, 266, 115, 80, 20, 'rgba(196,63,82,0.13)', 8);
    connector(ctx, 136, 112, 184, 112, C.red, 5);
    ctx.fillStyle = C.red;
    ctx.fillRect(176, 74, 11, 78);
  } else {
    camera(ctx, 60, 112, C.blue, 0.92);
    drawStageNodes(ctx, ['规划', '选模', '执行', '汇总'], Math.min(3, Math.floor(t * 4)), 155, 112, 92, 74);
    photo(ctx, 414, 74, 70, 72, C.green, 'rgba(34,141,92,0.1)');
  }
}

function renderRequestStress(ctx: CanvasRenderingContext2D, s: S) {
  const complexity = s.value / 100;
  photo(ctx, 52, 56, 218, 156, complexity > 0.7 ? C.red : C.blue, complexity > 0.7 ? 'rgba(196,63,82,0.08)' : 'rgba(39,68,110,0.08)');
  label(ctx, '用户请求', 86, 90, 20, C.ink, 'left', 800);
  ['文本', '图像', '检测', '语音'].forEach((v, i) => {
    const on = complexity > i * 0.22;
    pill(ctx, v, 82 + (i % 2) * 76, 112 + Math.floor(i / 2) * 42, on ? C.blue : C.muted, 58);
  });
  camera(ctx, 365, 138, complexity > 0.68 ? C.red : C.blue, 1.08);
  connector(ctx, 272, 138, 318, 138, complexity > 0.68 ? C.red : C.blue, 5);
  drawStageNodes(ctx, ['文本', '视觉', '检测', '语音'], clamp(Math.round(complexity * 4) - 1, 0, 3), 502, 124, 122, 92);
  drawBars(ctx, [{ label: '外部专家需求', value: complexity, color: complexity > 0.62 ? C.red : C.blue }], 728, 190, 250);
}

function renderClosedLoop(ctx: CanvasRenderingContext2D, s: S, time: number) {
  const active = s.started ? Math.floor((time / 620) % 4) : 0;
  photo(ctx, 56, 55, 190, 150, s.started ? C.green : C.red, s.started ? 'rgba(34,141,92,0.08)' : 'rgba(196,63,82,0.08)');
  label(ctx, s.started ? '可追踪闭环' : '人工拼接', 151, 96, 21, s.started ? C.green : C.red, 'center', 800);
  camera(ctx, 154, 143, s.started ? C.green : C.red, 0.95);
  drawStageNodes(ctx, ['任务规划', '模型选择', '任务执行', '回答生成'], s.started ? active : 0, 388, 133, 165, 136);
}

function renderModelCards(ctx: CanvasRenderingContext2D, s: S) {
  const focus = clamp(s.drag || s.value / 100, 0, 1);
  photo(ctx, 58, 54, 300, 160, C.blue, 'rgba(39,68,110,0.06)');
  label(ctx, '模型卡焦点', 96, 88, 21, C.ink, 'left', 800);
  drawViewfinder(ctx, 96 + focus * 150, 112, 88, 58, C.orange);
  camera(ctx, 102 + focus * 138, 196, C.blue, 0.76);
  drawBars(ctx, [
    { label: '任务名', value: 0.35 + focus * 0.2, color: C.blue },
    { label: '模型描述', value: 0.25 + focus * 0.7, color: C.green },
    { label: '约束信息', value: 0.2 + focus * 0.45, color: C.orange },
  ], 515, 74, 330);
}

function renderPlanGraph(ctx: CanvasRenderingContext2D, s: S) {
  const nodes = [
    { x: 164, y: 82, label: 'pose' },
    { x: 374, y: 82, label: 'gen-img' },
    { x: 584, y: 82, label: 'caption' },
    { x: 794, y: 82, label: 'speech' },
  ];
  nodes.forEach((n, i) => {
    if (i > 0) connector(ctx, nodes[i - 1].x + 56, nodes[i - 1].y + 28, n.x - 56, n.y + 28, i <= s.step ? C.blue : C.line, 4);
  });
  nodes.forEach((n, i) => {
    const on = i <= s.step;
    photo(ctx, n.x - 60, n.y, 120, 88, on ? (i < s.step ? C.green : C.blue) : C.line, on ? 'rgba(39,68,110,0.08)' : 'rgba(255,255,255,0.65)');
    label(ctx, n.label, n.x, n.y + 34, 18, on ? C.ink : C.muted, 'center', 750);
    pill(ctx, `T${i + 1}`, n.x - 24, n.y + 58, on ? C.orange : C.muted, 48);
  });
  label(ctx, ['读取姿态', '生成新图', '描述图像', '生成语音'][s.step], 540, 222, 23, C.blue, 'center', 800);
}

function renderControllerMetrics(ctx: CanvasRenderingContext2D, s: S) {
  const v = s.value;
  const title = v < 34 ? 'GPT-4 标注任务集' : v < 67 ? '复杂顺序/图任务' : '人标复杂请求';
  label(ctx, title, 116, 54, 22, C.ink, 'left', 800);
  const items = v < 34
    ? [
        { label: 'Alpaca F1', value: 0.0488, color: C.red },
        { label: 'Vicuna F1', value: 0.2944, color: C.orange },
        { label: 'GPT-3.5 F1', value: 0.5445, color: C.green },
      ]
    : v < 67
      ? [
          { label: 'Seq F1', value: 0.5192, color: C.green },
          { label: 'Graph F1', value: 0.5191, color: C.green },
          { label: 'ED 反向', value: 0.46, color: C.blue },
        ]
      : [
          { label: 'GPT-4 Seq Acc', value: 0.4136, color: C.green },
          { label: 'GPT-4 Graph Acc', value: 0.5833, color: C.green },
          { label: '仍有缺口', value: 0.39, color: C.orange },
        ];
  drawBars(ctx, items, 150, 90, 420);
  photo(ctx, 700, 70, 210, 130, v > 66 ? C.orange : C.blue, 'rgba(39,68,110,0.06)');
  camera(ctx, 805, 135, v > 66 ? C.orange : C.blue, 1.05);
}

function renderModelSelection(ctx: CanvasRenderingContext2D, s: S) {
  const task = s.mode || 'caption';
  const options = [
    { key: 'caption', label: 'Caption', model: 'vit-gpt2' },
    { key: 'detect', label: 'Detect', model: 'DETR' },
    { key: 'tts', label: 'TTS', model: 'FastSpeech' },
    { key: 'bad', label: '错配', model: '不适用' },
  ];
  options.forEach((o, i) => {
    const active = o.key === task;
    photo(ctx, 96 + i * 210, 62, 150, 128, active ? (task === 'bad' ? C.red : C.green) : C.line, active ? 'rgba(34,141,92,0.08)' : 'rgba(255,255,255,0.65)');
    label(ctx, o.label, 171 + i * 210, 104, 19, active ? C.ink : C.muted, 'center', 800);
    pill(ctx, o.model, 123 + i * 210, 134, active ? (task === 'bad' ? C.red : C.green) : C.muted, 96);
  });
  connector(ctx, 170, 214, task === 'bad' ? 800 : 590, 214, task === 'bad' ? C.red : C.green, 5);
}

function renderResourceChain(ctx: CanvasRenderingContext2D, s: S) {
  drawStageNodes(ctx, ['输入', '输出', '资源符号', '后续参数'], s.step, 190, 108, 190, 118);
  const x = 180 + s.step * 190;
  photo(ctx, x - 64, 175, 128, 56, C.orange, 'rgba(240,126,71,0.08)');
  label(ctx, `<resource-${s.step + 1}>`, x, 204, 18, C.orange, 'center', 800);
}

function renderDemoVariety(ctx: CanvasRenderingContext2D, s: S) {
  const v = s.value / 100;
  label(ctx, '演示覆盖越丰富，规划曲线越稳', 120, 54, 22, C.ink, 'left', 800);
  const baseY = 210;
  const left = 140;
  const width = 640;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, 68);
  ctx.lineTo(left, baseY);
  ctx.lineTo(left + width, baseY);
  ctx.stroke();
  [
    { color: C.blue, values: [0.43, 0.48, 0.52 + v * 0.03] },
    { color: C.green, values: [0.54, 0.61, 0.67 + v * 0.04] },
  ].forEach((line) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    line.values.forEach((val, i) => {
      const x = left + 95 + i * 210;
      const y = baseY - val * 145;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.stroke();
  });
  pill(ctx, 'GPT-3.5', 820, 86, C.blue, 86);
  pill(ctx, 'GPT-4', 820, 124, C.green, 86);
}

function renderArchitecture(ctx: CanvasRenderingContext2D, s: S) {
  const modes = ['plan', 'select', 'execute', 'respond'];
  const active = Math.max(0, modes.indexOf(s.mode || 'plan'));
  drawStageNodes(ctx, ['规划', '选模', '执行', '回答'], active, 150, 110, 190, 132);
  const details = [
    ['输入', '用户意图 + 资源'],
    ['依据', '模型描述 + 任务'],
    ['动作', '端点执行 + 资源'],
    ['输出', '日志 + 最终回答'],
  ];
  photo(ctx, 325, 184, 430, 62, C.blue, 'rgba(39,68,110,0.06)');
  label(ctx, details[active][0], 365, 215, 19, C.blue, 'left', 800);
  label(ctx, details[active][1], 455, 215, 19, C.ink, 'left', 700);
}

function renderEndpoints(ctx: CanvasRenderingContext2D, s: S) {
  const local = s.mode !== 'cloud';
  photo(ctx, 108, 58, 360, 150, local ? C.green : C.orange, local ? 'rgba(34,141,92,0.08)' : 'rgba(240,126,71,0.08)');
  label(ctx, local ? '本地端点优先' : '云端点回退', 288, 104, 24, local ? C.green : C.orange, 'center', 800);
  camera(ctx, 288, 152, local ? C.green : C.orange, 0.95);
  drawBars(ctx, [
    { label: '速度', value: local ? 0.85 : 0.48, color: local ? C.green : C.orange },
    { label: '覆盖', value: local ? 0.38 : 0.92, color: local ? C.orange : C.green },
    { label: '稳定兜底', value: local ? 0.55 : 0.8, color: C.blue },
  ], 610, 74, 310);
}

function renderRisks(ctx: CanvasRenderingContext2D, s: S) {
  const modes = ['planning', 'latency', 'length', 'unstable'];
  const active = Math.max(0, modes.indexOf(s.mode || 'planning'));
  const labels = ['规划', '时延', '长度', '不稳'];
  labels.forEach((item, i) => {
    photo(ctx, 112 + i * 205, 62, 138, 122, i === active ? C.red : C.line, i === active ? 'rgba(196,63,82,0.08)' : 'rgba(255,255,255,0.7)');
    label(ctx, item, 181 + i * 205, 105, 22, i === active ? C.red : C.muted, 'center', 800);
    const icon = ['计划不可行', '多轮调用', '描述过长', '输出漂移'][i];
    label(ctx, icon, 181 + i * 205, 143, 15, i === active ? C.red : C.muted, 'center', 700);
  });
  connector(ctx, 180, 214, 820, 214, C.red, 4, 0.25 + active * 0.24);
}

function renderResults(ctx: CanvasRenderingContext2D, s: S, time: number) {
  const metric = s.mode || 'human';
  const progress = s.started ? easeOutCubic((Math.sin(time / 960) + 1) / 2) : 0.2;
  const base = metric === 'human'
    ? [
        { label: 'Alpaca', value: 0.0692, color: C.red },
        { label: 'Vicuna', value: 0.1564, color: C.orange },
        { label: 'GPT-3.5', value: 0.6308, color: C.green },
      ]
    : [
        { label: 'Alpaca', value: 0.0488, color: C.red },
        { label: 'Vicuna', value: 0.2944, color: C.orange },
        { label: 'GPT-3.5', value: 0.5445, color: C.green },
      ];
  label(ctx, metric === 'human' ? '人评响应成功率' : '单任务规划 F1', 150, 54, 22, C.ink, 'left', 800);
  drawBars(ctx, base.map((b) => ({ ...b, value: b.value * progress })), 190, 88, 520, 48);
  photo(ctx, 792, 82, 116, 112, C.green, 'rgba(34,141,92,0.1)');
  label(ctx, '证据', 850, 132, 22, C.green, 'center', 800);
}

function renderModule(ctx: CanvasRenderingContext2D, id: string, s: S, time: number) {
  clearScene(ctx, W, H);
  if (id === '1.1') renderRequestStress(ctx, s);
  else if (id === '1.2') renderClosedLoop(ctx, s, time);
  else if (id === '2.1') renderModelCards(ctx, s);
  else if (id === '3.1') renderPlanGraph(ctx, s);
  else if (id === '4.1') renderControllerMetrics(ctx, s);
  else if (id === '5.1') renderModelSelection(ctx, s);
  else if (id === '6.1') renderResourceChain(ctx, s);
  else if (id === '7.1') renderDemoVariety(ctx, s);
  else if (id === '8.1') renderArchitecture(ctx, s);
  else if (id === '8.2') renderEndpoints(ctx, s);
  else if (id === '9.1') renderRisks(ctx, s);
  else if (id === '10.1') renderResults(ctx, s, time);
  else label(ctx, 'HuggingGPT', 540, 142, 30, C.blue, 'center', 800);
}

function feedback(id: string, s: S) {
  if (id === '1.1') return s.value > 68 ? { text: '复杂度升高后，单个文本模型已经无法独立完成视觉与语音链路。', cls: 'bad' } : { text: '低复杂度请求还能直接回答，但它不能代表真实多模态任务。', cls: '' };
  if (id === '1.2') return s.started ? { text: '四阶段闭环把断点变成可检查的中间状态。', cls: 'good' } : { text: '启动比较后，观察规划、选模、执行和汇总如何补上旧方法缺口。', cls: '' };
  if (id === '2.1') return (s.drag || s.value / 100) > 0.55 ? { text: '聚焦模型描述后，LLM 能把任务需求和专家能力对齐。', cls: 'good' } : { text: '只看任务名会过于粗糙，容易忽略领域、输入输出和限制。', cls: '' };
  if (id === '3.1') return s.step === 3 ? { text: '依赖图完成：前置视觉结果成为后续描述和语音的输入。', cls: 'good' } : { text: '继续推进，注意每个 id 如何产生后续任务需要的资源。', cls: '' };
  if (id === '4.1') return s.value > 66 ? { text: '人标数据提醒我们：更强控制器更好，但仍没有达到“总能最优”。', cls: 'good' } : s.value > 33 ? { text: 'GPT-3.5 在作者构造的规划评测中明显领先 7B 开源模型。', cls: 'good' } : { text: '弱控制器的规划准确率和 F1 都偏低，后续执行会被连带拖累。', cls: 'bad' };
  if (id === '5.1') return s.mode === 'bad' ? { text: '任务和模型不匹配：这正是模型选择阶段要避免的错误。', cls: 'bad' } : { text: '模型说明把“这个任务该找谁”变成 LLM 可读的选择问题。', cls: 'good' };
  if (id === '6.1') return s.step === 3 ? { text: '资源依赖被解析后，后续模型可以直接消费前置输出。', cls: 'good' } : { text: '每一步都要产出可追踪资源，否则链式执行会断开。', cls: '' };
  if (id === '7.1') return s.value > 70 ? { text: '多样演示提升规划，但论文也观察到示例数继续增加后收益有限。', cls: 'good' } : { text: '示例覆盖太窄时，LLM 容易学到格式却学不到任务变化。', cls: '' };
  if (id === '8.1') return { text: '当前阶段被高亮：系统结构的价值在于每段都有明确输入、输出和风险。', cls: 'good' };
  if (id === '8.2') return s.mode === 'cloud' ? { text: '云端点覆盖广，适合缺少本地模型时回退。', cls: '' } : { text: '本地端点更快更稳，但覆盖的专家模型更少。', cls: 'good' };
  if (id === '9.1') return { text: '这是作者明确写出的限制，设计智能体时应加入校验、回退和成本控制。', cls: 'bad' };
  if (id === '10.1') return s.started ? { text: '结果比较只能在同一协议内解释；成功率高不代表所有请求都能解决。', cls: 'good' } : { text: '启动赛跑后，比较论文表 3 与表 8 中可对应的指标。', cls: '' };
  return { text: '拖动或点击控件，观察机制变化。', cls: '' };
}

export const HuggingGPTLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(50);
  const [mode, setMode] = useState(moduleId === '5.1' ? 'caption' : moduleId === '8.1' ? 'plan' : 'human');
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [drag, setDrag] = useState(0.25);
  const stateRef = useRef<S>({ value, mode, step, started, drag });
  stateRef.current = { value, mode, step, started, drag };

  const isAna = moduleId === 'ana';
  const isHero = chapterId === 'hero';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = isAna ? AW : isHero ? HW : W;
    const h = isAna ? AH : isHero ? HH : H;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (time: number) => {
      if (isAna) renderAnalogy(ctx, chapterId, time);
      else if (isHero) renderHero(ctx, moduleId, time);
      else renderModule(ctx, moduleId, stateRef.current, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId, moduleId, isAna, isHero]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (moduleId !== '2.1') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setDrag(next);
    setValue(Math.round(next * 100));
  };

  if (isAna || isHero) {
    return <canvas ref={canvasRef} width={isAna ? AW : HW} height={isAna ? AH : HH} />;
  }

  const fb = feedback(moduleId, stateRef.current);
  const chips: Record<string, [string, string][]> = {
    '5.1': [['caption', '图像描述'], ['detect', '目标检测'], ['tts', '语音合成'], ['bad', '错配']],
    '8.1': [['plan', '规划'], ['select', '选模'], ['execute', '执行'], ['respond', '回答']],
    '8.2': [['local', '本地优先'], ['cloud', '云端回退']],
    '9.1': [['planning', '规划'], ['latency', '时延'], ['length', '长度'], ['unstable', '不稳定']],
    '10.1': [['human', '人评成功率'], ['single', '单任务 F1']],
  };
  const sliderIds = new Set(['1.1', '4.1', '7.1']);
  const stepIds = new Set(['3.1', '6.1']);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointer}
        onPointerMove={(e) => {
          if (e.buttons === 1) onPointer(e);
        }}
      />
      {sliderIds.has(moduleId) ? (
        <div className="ctrl">
          <label>
            参数 <span className="val">{(value / 100).toFixed(2)}</span>
          </label>
          <input type="range" min={0} max={100} value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
      ) : chips[moduleId] ? (
        <div className="chip-row">
          {chips[moduleId].map(([key, chipLabel]) => (
            <button key={key} className={'chip ' + (mode === key ? 'selected' : '')} onClick={() => setMode(key)}>
              {chipLabel}
            </button>
          ))}
          {moduleId === '10.1' ? (
            <button className="tiny" onClick={() => setStarted(true)}>
              开始比较
            </button>
          ) : null}
        </div>
      ) : stepIds.has(moduleId) ? (
        <div className="step-ctrl">
          <button className="tiny ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            上一步
          </button>
          <span className="step-label">
            <b>{step + 1}</b> / 4
          </span>
          <button className="tiny" onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>
            下一步
          </button>
        </div>
      ) : moduleId === '1.2' ? (
        <div className="step-ctrl">
          <button className="tiny" onClick={() => setStarted(!started)}>
            {started ? '重置' : '启动闭环'}
          </button>
        </div>
      ) : null}
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default HuggingGPTLab;
