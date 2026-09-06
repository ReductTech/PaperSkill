import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const WIDE_W = 900;
const WIDE_H = 240;

const color = {
  bg: '#f8fbff',
  panel: '#ffffff',
  soft: '#eef5ff',
  line: '#d7e4f5',
  text: '#16335f',
  muted: '#6d7f99',
  blue: '#1268e8',
  blue2: '#5aa2ff',
  green: '#22a06b',
  red: '#d94a5f',
  orange: '#f08a24',
  purple: '#7c3aed',
  shadow: 'rgba(18,104,232,0.10)',
};

type WidgetKind =
  | 'heroOld'
  | 'heroNew'
  | 'analogy'
  | 'cut'
  | 'alignment'
  | 'event'
  | 'objective'
  | 'reasoning'
  | 'inference'
  | 'training'
  | 'architecture'
  | 'frameworkOverview'
  | 'frameworkReasoning'
  | 'frameworkWorld'
  | 'frameworkFusion'
  | 'multiview'
  | 'data'
  | 'results'
  | 'resultsWins'
  | 'summary';

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 14, fill = color.text, weight = 600) {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(s, x, y);
}

function centerText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 14, fill = color.text, weight = 700) {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

function base(ctx: CanvasRenderingContext2D, w = W, h = H) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#f1f7ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke = color.line) {
  ctx.shadowColor = color.shadow;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = color.panel;
  round(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, w: number, fill: string, fg = '#fff') {
  ctx.fillStyle = fill;
  round(ctx, x, y, w, 28, 14);
  ctx.fill();
  centerText(ctx, s, x + w / 2, y + 19, 13, fg, 800);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, stroke = color.blue) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(a - 0.45), y2 - 10 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.45), y2 - 10 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

function drawEventTimeline(ctx: CanvasRenderingContext2D, mode: 'chunk' | 'event', highlight = 0) {
  const y = 132;
  const start = 48;
  const width = 464;
  ctx.strokeStyle = color.line;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(start + width, y);
  ctx.stroke();

  const phases = [
    ['靠近', 0, 0.18],
    ['接触', 0.18, 0.36],
    ['抬起', 0.36, 0.55],
    ['转移', 0.55, 0.8],
    ['释放', 0.8, 1],
  ] as const;

  phases.forEach(([name, a, b], i) => {
    const x1 = start + width * a;
    const x2 = start + width * b;
    ctx.strokeStyle = mode === 'event' ? color.green : i === Math.floor(highlight * 5) ? color.orange : color.blue2;
    ctx.lineWidth = mode === 'event' ? 10 : 8;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    centerText(ctx, name, (x1 + x2) / 2, y - 22, 13, color.muted, 700);
  });

  const cuts = mode === 'event' ? [0.18, 0.36, 0.55, 0.8] : [0.14, 0.32, 0.5, 0.68, 0.86];
  cuts.forEach((p) => {
    const x = start + width * p;
    ctx.strokeStyle = mode === 'event' ? color.green : color.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 42);
    ctx.lineTo(x, y + 42);
    ctx.stroke();
  });
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

function between(p: number, a: number, b: number) {
  return clamp((p - a) / (b - a), 0, 1);
}

function robotPose(p: number) {
  const e1 = easeInOutQuad(between(p, 0, 0.22));
  const e2 = easeInOutQuad(between(p, 0.34, 0.52));
  const e3 = easeInOutQuad(between(p, 0.52, 0.74));
  const e4 = easeInOutQuad(between(p, 0.74, 0.9));
  let x = mix(210, 356, e1);
  let y = mix(104, 128, e1);
  if (p >= 0.34) y = mix(128, 82, e2);
  if (p >= 0.52) x = mix(356, 450, e3);
  if (p >= 0.74) y = mix(82, 132, e4);
  const holding = p >= 0.28 && p < 0.9;
  return { x, y, closed: p >= 0.22 && p < 0.9, holding };
}

function drawRobotArm(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, endX: number, endY: number, stroke: string) {
  const elbowX = mix(baseX, endX, 0.48);
  const elbowY = Math.min(baseY, endY) - 46;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  [baseX, elbowX, endX].forEach((x, i) => {
    const y = i === 0 ? baseY : i === 1 ? elbowY : endY;
    ctx.beginPath();
    ctx.arc(x, y, i === 2 ? 8 : 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function drawCup(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string) {
  ctx.fillStyle = fill;
  round(ctx, x - 14, y - 26, 28, 30, 6);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 18);
  ctx.lineTo(x + 10, y - 18);
  ctx.stroke();
}

function drawRobotScene(ctx: CanvasRenderingContext2D, p: number, stroke: string, broken = false) {
  const pose = robotPose(p);
  const cupX = pose.holding ? pose.x : p >= 0.9 ? 450 : 356;
  const cupY = pose.holding ? pose.y + 28 : 158;
  ctx.strokeStyle = '#cfe0f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, 164);
  ctx.lineTo(512, 164);
  ctx.stroke();
  ctx.fillStyle = '#e8f1fb';
  round(ctx, 88, 164, 386, 14, 7);
  ctx.fill();
  drawCup(ctx, cupX, cupY, broken ? color.red : color.orange);
  drawRobotArm(ctx, 126, 154, pose.x, pose.y, stroke);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (pose.closed) {
    ctx.moveTo(pose.x - 5, pose.y + 5);
    ctx.lineTo(pose.x - 13, pose.y + 23);
    ctx.moveTo(pose.x + 5, pose.y + 5);
    ctx.lineTo(pose.x + 13, pose.y + 23);
  } else {
    ctx.moveTo(pose.x - 5, pose.y + 5);
    ctx.lineTo(pose.x - 20, pose.y + 18);
    ctx.moveTo(pose.x + 5, pose.y + 5);
    ctx.lineTo(pose.x + 20, pose.y + 18);
  }
  ctx.stroke();
}

function drawScaledRobotScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  p: number,
  stroke: string,
  broken = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-48, -48);
  drawRobotScene(ctx, p, stroke, broken);
  ctx.restore();
}

function drawHeroTimeline(ctx: CanvasRenderingContext2D, labels: string[], accent: string, marker: number) {
  const x0 = 76;
  const y = 196;
  const w = 384;
  ctx.fillStyle = accent + '12';
  round(ctx, x0, 176, w, 40, 10);
  ctx.fill();
  ctx.strokeStyle = '#d8e7f7';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + w, y);
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + w, y);
  ctx.stroke();

  labels.forEach((label, i) => {
    const x = x0 + 18 + i * ((w - 36) / (labels.length - 1));
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    centerText(ctx, label, x, 232, 12, color.text, 800);
  });

  ctx.fillStyle = color.orange;
  ctx.beginPath();
  ctx.arc(x0 + w * marker, y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeroTitleGroup(ctx: CanvasRenderingContext2D, title: string, subtitle: string, accent: string) {
  ctx.save();
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.8px';
  }
  text(ctx, title, 42, 42, 18, accent, 900);
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.5px';
  }
  text(ctx, subtitle, 42, 66, 12, color.muted, 800);
  ctx.restore();
}

function drawRobotCutDemo(ctx: CanvasRenderingContext2D, mode: 'chunk' | 'event', t: number) {
  const p = (t % 360) / 360;
  const accent = mode === 'chunk' ? color.red : color.green;
  const title = mode === 'chunk' ? '传统 fixed chunk' : 'WALL-WM 事件切分';
  const caption =
    mode === 'chunk'
      ? '固定窗口不看行为边界，可能把“夹住杯子”和“抬起杯子”截成半段。'
      : '事件边界等完整行为闭合后再切，caption、视频、动作指向同一段。';

  text(ctx, title, 34, 34, 16, accent, 900);
  text(ctx, caption, 34, 56, 13, color.muted, 700);

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = mode === 'chunk' ? color.red : color.green;
  ctx.lineWidth = 56;
  ctx.beginPath();
  ctx.moveTo(186, 124);
  ctx.bezierCurveTo(274, 74, 392, 76, 466, 126);
  ctx.stroke();
  ctx.restore();

  if (mode === 'chunk') {
    const stops = [0.22, 0.42, 0.64];
    const labels = ['接触中断', '抬起中断', '转移混合'];
    const active = Math.floor((t / 94) % stops.length);
    drawRobotScene(ctx, stops[active], color.red, true);

    ctx.strokeStyle = color.line;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 198);
    ctx.lineTo(496, 198);
    ctx.stroke();

    stops.forEach((stop, i) => {
      const x = 64 + 432 * stop;
      ctx.fillStyle = i === active ? 'rgba(217,74,95,0.22)' : 'rgba(217,74,95,0.10)';
      round(ctx, x - 34, 176, 68, 44, 8);
      ctx.fill();
      ctx.strokeStyle = color.red;
      ctx.lineWidth = i === active ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x, 168);
      ctx.lineTo(x, 222);
      ctx.stroke();
      centerText(ctx, labels[i], x, 235, 11, i === active ? color.red : color.muted, 800);
    });

    pill(ctx, '局部目标变模糊', 376, 76, 126, color.red);
    return;
  }

  drawRobotScene(ctx, p, color.green);
  const marks = [
    ['靠近', 0.12],
    ['夹住', 0.3],
    ['抬起', 0.48],
    ['放下', 0.9],
  ] as const;
  ctx.strokeStyle = color.green;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(64, 198);
  ctx.lineTo(496, 198);
  ctx.stroke();
  ctx.fillStyle = 'rgba(34,160,107,0.12)';
  round(ctx, 74, 176, 392, 44, 10);
  ctx.fill();
  ctx.strokeStyle = color.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(74, 176);
  ctx.lineTo(74, 220);
  ctx.moveTo(466, 176);
  ctx.lineTo(466, 220);
  ctx.stroke();
  marks.forEach(([label, pos]) => {
    const x = 64 + 432 * pos;
    ctx.fillStyle = color.green;
    ctx.beginPath();
    ctx.arc(x, 200, 6, 0, Math.PI * 2);
    ctx.fill();
    centerText(ctx, label, x, 222, 12, color.text, 800);
  });
  const runner = 64 + 432 * p;
  ctx.fillStyle = color.orange;
  ctx.beginPath();
  ctx.arc(runner, 200, 8, 0, Math.PI * 2);
  ctx.fill();
  pill(ctx, '完整事件闭合', 392, 76, 110, color.green);
}

function drawCutBoundaryLab(ctx: CanvasRenderingContext2D, mode: 'chunk' | 'event', t: number) {
  const play = (t % 420) / 420;
  const accent = mode === 'chunk' ? color.red : color.green;
  text(ctx, mode === 'chunk' ? '固定 chunk：按钟表等距切' : '语义事件：按行为边界切', 34, 32, 16, accent, 900);
  text(ctx, mode === 'chunk' ? '红线位置固定，不看接触、抬起是否完成。' : '绿线落在阶段切换处，等动作语义闭合。', 34, 52, 13, color.muted, 700);

  const rows = [
    ['语言', ['靠近', '接触', '抬起', '转移', '放下'], 72],
    ['视频', ['靠近', '接触', '离桌', '移动', '落位'], 114],
    ['动作', ['移动', '闭爪', '上提', '平移', '开爪'], 156],
  ] as const;
  const start = 126;
  const width = 388;
  const phases = [
    [0, 0.2, color.blue2],
    [0.2, 0.36, color.orange],
    [0.36, 0.55, color.green],
    [0.55, 0.78, color.blue],
    [0.78, 1, color.purple],
  ] as const;
  const chunkCuts = [0.25, 0.5, 0.75];
  const eventCuts = [0.2, 0.36, 0.55, 0.78];
  const runnerX = start + width * play;

  rows.forEach(([label, stageLabels, y]) => {
    text(ctx, label, 46, y + 5, 15, color.text, 900);
    ctx.strokeStyle = '#e3edf8';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.lineTo(start + width, y);
    ctx.stroke();
    phases.forEach(([a, b, c], i) => {
      const x1 = start + width * a;
      const x2 = start + width * b;
      ctx.strokeStyle = c;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      centerText(ctx, stageLabels[i], (x1 + x2) / 2, y + 28, 10, color.muted, 700);
    });
  });

  if (mode === 'chunk') {
    const nearestCut = chunkCuts.reduce((best, cut) => (Math.abs(play - cut) < Math.abs(play - best) ? cut : best), chunkCuts[0]);
    const labels: Record<number, string> = {
      0.25: '接触中',
      0.5: '抬起中',
      0.75: '转移中',
    };
    chunkCuts.forEach((cut) => {
      const x = start + width * cut;
      ctx.strokeStyle = color.red;
      ctx.lineWidth = cut === nearestCut ? 4 : 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(x, 56);
      ctx.lineTo(x, 172);
      ctx.stroke();
      ctx.setLineDash([]);
      centerText(ctx, 'chunk', x, 190, 10, color.red, 800);
    });
    const chunkLeft = Math.max(0, Math.floor(play / 0.25) * 0.25);
    const chunkRight = Math.min(1, chunkLeft + 0.25);
    ctx.fillStyle = 'rgba(217,74,95,0.09)';
    round(ctx, start + width * chunkLeft, 58, width * (chunkRight - chunkLeft), 112, 8);
    ctx.fill();
    pill(ctx, labels[nearestCut] || '固定切点', 406, 30, 84, color.red);
    ctx.fillStyle = '#fff6f7';
    round(ctx, 34, 214, 492, 22, 11);
    ctx.fill();
    centerText(ctx, '问题：边界按时间等距出现，可能正好切在行为内部。', 280, 230, 13, color.red, 800);
    ctx.strokeStyle = color.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(runnerX, 58);
    ctx.lineTo(runnerX, 172);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = 'rgba(34,160,107,0.12)';
  round(ctx, start, 58, width, 112, 8);
  ctx.fill();
  eventCuts.forEach((cut) => {
    const x = start + width * cut;
    ctx.strokeStyle = color.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 56);
    ctx.lineTo(x, 172);
    ctx.stroke();
    centerText(ctx, 'event', x, 190, 10, color.green, 800);
  });
  const currentEvent = eventCuts.findIndex((cut) => play < cut);
  const eventLabel = currentEvent <= 0 ? '靠近事件' : currentEvent === 1 ? '接触事件' : currentEvent === 2 ? '抬起事件' : currentEvent === 3 ? '转移事件' : '放下事件';
  pill(ctx, eventLabel, 398, 30, 96, color.green);
  ctx.fillStyle = '#f1fbf6';
  round(ctx, 34, 214, 492, 22, 11);
  ctx.fill();
  centerText(ctx, '结果：边界跟随行为阶段，语言、视频、动作对齐到完整事件。', 280, 230, 13, color.green, 800);
  ctx.strokeStyle = color.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(runnerX, 58);
  ctx.lineTo(runnerX, 172);
  ctx.stroke();
}

function drawHero(ctx: CanvasRenderingContext2D, kind: 'old' | 'new', t: number) {
  base(ctx);
  const p = (t % 360) / 360;
  const accent = kind === 'old' ? color.red : color.green;
  drawHeroTitleGroup(ctx, kind === 'old' ? '固定 chunk' : 'WALL-WM', kind === 'old' ? '同一动作被切碎' : '按事件完成一段动作', accent);

  if (kind === 'old') {
    const stops = [0.22, 0.42, 0.64];
    const active = Math.floor((t / 96) % stops.length);
    drawScaledRobotScene(ctx, 54, 72, 0.74, stops[active], color.red, true);
    drawHeroTimeline(ctx, ['截断1', '截断2', '截断3', '截断4'], color.red, stops[active]);
    return;
  }

  drawScaledRobotScene(ctx, 54, 72, 0.74, p, color.green);
  drawHeroTimeline(ctx, ['靠近', '夹住', '抬起', '放下'], color.green, p);
}

function drawAnalogy(ctx: CanvasRenderingContext2D, chapterNum: number, t: number) {
  base(ctx);
  const labels = ['问题', '错位', '目标', '框架', '模式', '数据', '实验', '结论'];
  const current = clamp(chapterNum - 1, 0, labels.length - 1);
  const pulse = 0.5 + Math.sin(t / 48) * 0.5;

  text(ctx, '八章路线图', 36, 36, 16, color.blue, 900);
  text(ctx, '当前章节在整篇论文叙事里的位置', 36, 58, 13, color.muted, 700);

  const startX = 52;
  const gap = 64;
  const y = 118;
  ctx.strokeStyle = color.line;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(startX + gap * (labels.length - 1), y);
  ctx.stroke();

  labels.forEach((label, i) => {
    const x = startX + gap * i;
    const past = i < current;
    const active = i === current;
    ctx.fillStyle = active ? color.blue : past ? '#b8d4f5' : '#e5edf7';
    ctx.beginPath();
    ctx.arc(x, y, active ? 16 + pulse * 2 : 11, 0, Math.PI * 2);
    ctx.fill();
    centerText(ctx, String(i + 1), x, y + 5, active ? 13 : 10, active ? '#fff' : color.muted, 900);
    centerText(ctx, label, x, 154, 11, active ? color.blue : color.muted, active ? 900 : 700);
  });

  const focus = [
    '为什么固定 chunk 不自然',
    '语言、视频、动作的粒度错位',
    '用事件联合预测未来视频和动作',
    'Figure 3：推理、建模、融合接起来',
    'event mode 与 unified mode 怎么用',
    '事件数据如何切分、标注和均衡',
    'Table 5：真实机器人结果说明什么',
    '贡献边界：按事件切，不是万能控制器',
  ][current];
  card(ctx, 92, 178, 376, 34, color.line);
  centerText(ctx, focus, 280, 200, 13, color.text, 800);
}

function drawEllipseField(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke: string) {
  ctx.save();
  for (let i = 5; i >= 1; i -= 1) {
    ctx.globalAlpha = 0.08 + i * 0.035;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, (rx * i) / 5, (ry * i) / 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  for (let i = 1; i <= 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, (rx * i) / 5, (ry * i) / 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlignment(ctx: CanvasRenderingContext2D, v: number) {
  base(ctx);
  const yaw = (v - 0.5) * Math.PI * 1.8;
  const pitch = 0.28 + 0.62 * v;
  const cx = 280;
  const cy = 128;
  const scale = 78;
  const project = (x: number, y: number, z: number) => {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const xr = x * cos - y * sin;
    const yr = x * sin + y * cos;
    return {
      x: cx + xr * scale,
      y: cy + yr * scale * Math.cos(pitch) - z * scale * Math.sin(pitch),
    };
  };

  text(ctx, 'Figure 1：模态流形不是同一张平面', 30, 32, 16, color.text, 900);
  text(ctx, '拖动画布旋转视角；俯视时能看到三者几何形状和尺度不同。', 30, 53, 13, color.muted, 700);

  ctx.strokeStyle = '#dfe7f0';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i += 1) {
    const a = project(i * 0.45, -1.5, 0);
    const b = project(i * 0.45, 1.5, 0);
    const c = project(-1.5, i * 0.45, 0);
    const d = project(1.5, i * 0.45, 0);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }

  const modalities = [
    { name: 'Instruction', zh: '语言：粗语义', pos: [0.82, -0.58, 1.16], rx: 70, ry: 22, c: color.blue },
    { name: 'Vision', zh: '视觉：时空动态', pos: [-0.14, -0.08, 0.68], rx: 54, ry: 40, c: color.green },
    { name: 'Action', zh: '动作：接触精度', pos: [-0.95, 0.72, -0.18], rx: 38, ry: 24, c: color.orange },
  ] as const;

  modalities
    .map((m) => ({ ...m, screen: project(m.pos[0], m.pos[1], m.pos[2]), ground: project(m.pos[0], m.pos[1], 0) }))
    .sort((a, b) => a.screen.y - b.screen.y)
    .forEach((m) => {
      ctx.strokeStyle = m.c;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(m.screen.x, m.screen.y);
      ctx.lineTo(m.ground.x, m.ground.y);
      ctx.stroke();
      ctx.setLineDash([]);
      drawEllipseField(ctx, m.screen.x, m.screen.y, m.rx, m.ry, m.c, m.c);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(m.screen.x, m.screen.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = m.c;
      ctx.lineWidth = 2;
      ctx.stroke();
      centerText(ctx, m.name, m.screen.x, m.screen.y - m.ry - 12, 17, m.c, 900);
      centerText(ctx, m.zh, m.screen.x, m.screen.y + m.ry + 20, 12, color.text, 800);
    });

  const topView = v > 0.72;
  ctx.fillStyle = topView ? '#f1fbf6' : '#eef5ff';
  round(ctx, 34, 204, 492, 24, 12);
  ctx.fill();
  centerText(
    ctx,
    topView ? '俯视结论：三者尺度与邻域形状不同，不能粗暴塞进同一嵌入空间。' : '斜视结论：三者处在不同抽象高度，视频只是连接语言与动作的桥。',
    280,
    221,
    12,
    topView ? color.green : color.blue,
    800
  );
}

function drawEventCheck(ctx: CanvasRenderingContext2D, v: number) {
  base(ctx);
  const links = [v >= 1, v >= 2];
  const complete = links.every(Boolean);
  const items = [
    ['语言', '能说清', color.blue],
    ['视频', '能看见', color.green],
    ['动作', '能执行', color.orange],
  ] as const;

  text(ctx, '把三个条件相加，才是事件训练原子', 46, 34, 16, color.text, 900);
  text(ctx, '点击下方加号连接相邻粒度', 46, 54, 13, color.muted, 700);

  items.forEach(([name, desc, c], i) => {
    const x = 44 + i * 184;
    const connected = i === 0 || links[i - 1];
    card(ctx, x, 78, 132, 88, connected ? c : color.line);
    ctx.fillStyle = connected ? c : '#ccd8e6';
    ctx.beginPath();
    ctx.arc(x + 66, 106, 15, 0, Math.PI * 2);
    ctx.fill();
    centerText(ctx, connected ? '✓' : '·', x + 66, 112, 17, '#fff', 900);
    centerText(ctx, name, x + 66, 142, 15, color.text, 900);
    centerText(ctx, desc, x + 66, 160, 12, color.muted, 800);
  });

  links.forEach((on, i) => {
    const x = 197 + i * 184;
    ctx.fillStyle = on ? color.green : '#ffffff';
    ctx.strokeStyle = on ? color.green : color.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, 122, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    centerText(ctx, '+', x, 130, 24, on ? '#fff' : color.blue, 900);
    ctx.strokeStyle = on ? color.green : color.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 48, 122);
    ctx.lineTo(x - 22, 122);
    ctx.moveTo(x + 22, 122);
    ctx.lineTo(x + 48, 122);
    ctx.stroke();
  });

  ctx.fillStyle = complete ? '#f1fbf6' : '#fff6f7';
  round(ctx, 52, 198, 456, 28, 14);
  ctx.fill();
  centerText(
    ctx,
    complete ? '三者相加成立：可作为 action-grounded semantic event 训练原子' : links[0] || links[1] ? '还差一个连接：三种粒度尚未共同闭合' : '还不是事件：语言、视频、动作仍是分离条件',
    280,
    217,
    13,
    complete ? color.green : color.red,
    800
  );
}

function drawObjective(ctx: CanvasRenderingContext2D, v: number) {
  base(ctx);
  const mode = Math.max(0, Math.min(2, Math.round(v)));
  const modes = [
    {
      title: '普通 VLA（OpenVLA / π0.5）',
      accent: color.red,
      summary: '只做“当前视觉 + 语言 -> 固定动作块”的反应式映射。',
      footer: '不预测未来画面，训练单位是固定 chunk。',
    },
    {
      title: '传统通用 WAM',
      accent: color.orange,
      summary: '只做“当前观测 + 动作 -> 下一帧观测”的世界动力学建模。',
      footer: '不接自然语言指令，核心目标是下一帧观测。',
    },
    {
      title: 'WALL-WM',
      accent: color.green,
      summary: '把 V0、s、ce 放进同一条件分布，联合预测 Ve 和 ae。',
      footer: '事件是最小单元，长度跟语义走，不被固定窗口硬切。',
    },
  ] as const;
  const active = modes[mode];

  text(ctx, '三类建模目标流程图', 34, 30, 17, color.text, 900);
  text(ctx, '点击下方按钮切换流程图。先看普通 VLA，再看传统通用 WAM，最后回到 WALL-WM。', 34, 50, 13, color.muted, 800);
  text(ctx, active.title, 34, 74, 14, active.accent, 900);

  if (mode === 0) {
    card(ctx, 34, 92, 154, 110, color.red);
    pill(ctx, '当前单帧视觉', 54, 112, 114, color.red);
    pill(ctx, '全局语言指令', 54, 148, 114, color.blue2);
    arrow(ctx, 188, 138, 248, 138, color.red);
    card(ctx, 248, 102, 134, 74, color.red);
    centerText(ctx, 'OpenVLA / π0.5', 315, 127, 13, color.red, 900);
    text(ctx, '反应式动作头', 287, 150, 11, color.muted, 800);
    arrow(ctx, 382, 138, 418, 138, color.red);
    card(ctx, 422, 92, 104, 110, color.red);
    centerText(ctx, '固定动作块', 474, 128, 16, color.red, 900);
    text(ctx, 'a_t ... a_{t+k}', 438, 158, 12, color.muted, 800);
    return;
  }

  if (mode === 1) {
    card(ctx, 34, 92, 154, 110, color.orange);
    pill(ctx, '当前观测', 56, 112, 94, color.orange);
    pill(ctx, '当前动作', 56, 148, 94, color.blue2);
    arrow(ctx, 188, 138, 248, 138, color.orange);
    card(ctx, 248, 102, 134, 74, color.orange);
    centerText(ctx, '传统 WAM', 315, 127, 15, color.orange, 900);
    text(ctx, '世界动力学', 287, 150, 11, color.muted, 800);
    arrow(ctx, 382, 138, 418, 138, color.orange);
    card(ctx, 422, 92, 104, 110, color.orange);
    centerText(ctx, '下一帧观测', 474, 128, 15, color.orange, 900);
    text(ctx, 'V_{t+1}', 440, 158, 12, color.muted, 800);
    return;
  }

  card(ctx, 34, 86, 160, 120, color.green);
  pill(ctx, 'V0 当前观测', 48, 104, 118, color.blue);
  pill(ctx, 's 本体状态', 64, 140, 86, color.blue2);
  pill(ctx, 'ce 事件文本', 54, 176, 106, color.orange);
  arrow(ctx, 194, 122, 246, 122, color.green);
  arrow(ctx, 194, 158, 246, 158, color.green);
  arrow(ctx, 194, 194, 246, 194, color.green);
  card(ctx, 252, 98, 118, 96, color.green);
  centerText(ctx, 'WALL-WM', 311, 124, 18, color.green, 900);
  centerText(ctx, '视频塔 + 动作塔', 311, 148, 12, color.text, 800);
  text(ctx, '事件级联合建模', 280, 172, 11, color.muted, 800);
  arrow(ctx, 370, 122, 412, 106, color.green);
  arrow(ctx, 370, 160, 412, 182, color.green);
  card(ctx, 414, 86, 114, 52, color.green);
  centerText(ctx, 'Ve 未来视频', 471, 116, 15, color.green, 900);
  card(ctx, 414, 154, 114, 52, color.green);
  centerText(ctx, 'ae 完整动作', 471, 184, 15, color.green, 900);
}

function drawReasoning(ctx: CanvasRenderingContext2D, mode: number) {
  base(ctx);
  const labels = ['全局指令', 'VLM看当前局面', '下一事件短句', '连续隐推理'];
  labels.forEach((s, i) => {
    const x = 34 + i * 132;
    card(ctx, x, 78, 112, 74, i === mode ? color.blue : color.line);
    centerText(ctx, s, x + 56, 113, 13, i === mode ? color.blue : color.text, 800);
    if (i < labels.length - 1) arrow(ctx, x + 116, 115, x + 128, 115, color.line);
  });
  text(ctx, mode === 3 ? 'Staircase 不逐字输出长思维链，而是并行生成可微隐状态。' : '高层语言先被压成“下一步该做什么”。', 48, 204, 15, color.muted, 800);
}

function drawInference(ctx: CanvasRenderingContext2D, step: number) {
  base(ctx, WIDE_W, WIDE_H);
  const states = [
    {
      label: '还没拿刀',
      event: '左手抓住刀',
      history: '刚开始，只看到桌面',
      latent: '意图：抓取餐具',
      chunk: '靠近并闭合夹爪',
    },
    {
      label: '刀已拿起',
      event: '把刀放到盘子右侧',
      history: '刀已经在夹爪中',
      latent: '意图：转移餐具',
      chunk: '右移并松开',
    },
    {
      label: '食物已放好',
      event: '把花插进花瓶',
      history: '食物已经放到盘中',
      latent: '意图：完成装饰',
      chunk: '伸向花瓶并插入',
    },
  ] as const;
  const s = states[Math.max(0, Math.min(states.length - 1, step))];

  text(ctx, '条件路由器：同一进度，两种接口给 WAM 的条件不同', 44, 30, 18, color.text, 900);
  text(ctx, '全局任务：用刀、食物和花完成桌面摆盘', 44, 52, 13, color.muted, 800);

  states.forEach((item, i) => {
    pill(ctx, item.label, 52 + i * 118, 70, 96, i === step ? color.orange : color.blue2);
  });

  card(ctx, 44, 104, 384, 124, color.green);
  text(ctx, '事件模式', 66, 132, 15, color.green, 900);
  pill(ctx, '当前观测', 64, 150, 72, color.blue2);
  arrow(ctx, 146, 164, 184, 164, color.green);
  dashedBox(ctx, 188, 140, 168, 46, color.green);
  centerText(ctx, '下一事件文本', 272, 158, 12, color.green, 800);
  centerText(ctx, s.event, 272, 178, 12, color.green, 800);
  arrow(ctx, 358, 164, 402, 164, color.green);
  text(ctx, '直接把事件文本送入 WAM', 66, 198, 12, color.muted, 700);
  ctx.fillStyle = 'rgba(34,160,107,0.10)';
  round(ctx, 188, 204, 190, 20, 8);
  ctx.fill();
  centerText(ctx, `事件输出：${s.chunk}`, 283, 218, 11, color.green, 800);

  card(ctx, 472, 104, 384, 124, color.blue);
  text(ctx, '统一模式', 494, 132, 15, color.blue, 900);
  pill(ctx, '全局指令', 494, 150, 70, color.blue);
  pill(ctx, '历史窗口', 578, 150, 70, color.blue2);
  pill(ctx, '阶梯隐状态', 662, 150, 96, color.orange);
  arrow(ctx, 762, 164, 818, 164, color.blue);
  text(ctx, `历史：${s.history}`, 494, 188, 11, color.muted, 700);
  text(ctx, `隐状态：${s.latent}`, 640, 188, 11, color.orange, 700);
  ctx.fillStyle = 'rgba(18,104,232,0.08)';
  round(ctx, 570, 204, 210, 20, 8);
  ctx.fill();
  centerText(ctx, `固定 chunk：${s.chunk}`, 675, 218, 11, color.blue, 800);
}

function drawTraining(ctx: CanvasRenderingContext2D, step: number) {
  base(ctx, WIDE_W, WIDE_H);
  text(ctx, '训练到部署：Section 5 训练一套事件 WAM 主干，Section 6.2 把它压到实时服务', 34, 28, 16, color.text, 900);
  text(ctx, '读图顺序：上面看训练阶段，中间看产物，下面看部署出口。', 34, 48, 12, color.muted, 800);

  const stages = [
    ['1 视频塔', '学未来画面', 'Video DiT', color.blue],
    ['2 动作塔', '读视频 KV', 'Action DiT', color.green],
    ['3 VLM', '预测下一事件', 'Qwen heads', color.orange],
    ['4 Staircase', '并行隐推理', 'MoT branch', color.purple],
    ['5 chunk适配', '兼容固定窗口', 'optional', color.blue2],
  ] as const;

  ctx.fillStyle = 'rgba(109,127,153,0.10)';
  round(ctx, 34, 80, 70, 24, 12);
  ctx.fill();
  centerText(ctx, '训练阶段', 69, 96, 12, color.muted, 900);
  stages.forEach(([title, status, desc, c], i) => {
    const x = 116 + i * 146;
    const active = i === Math.min(step, 4);
    card(ctx, x, 66, 108, 58, active ? c : color.line);
    text(ctx, title, x + 10, 86, 12, active ? c : color.text, 900);
    ctx.fillStyle = c + '18';
    round(ctx, x + 10, 92, 78, 18, 9);
    ctx.fill();
    centerText(ctx, status, x + 49, 105, 10, c, 800);
    text(ctx, desc, x + 10, 119, 9, color.muted, 700);
    if (i < stages.length - 1) arrow(ctx, x + 112, 94, x + 140, 94, i < step ? color.green : color.line);
  });

  ctx.fillStyle = 'rgba(34,160,107,0.10)';
  round(ctx, 248, 140, 404, 30, 15);
  ctx.fill();
  centerText(ctx, '产物：同一套事件预训练 WAM 主干', 450, 159, 13, color.green, 900);
  arrow(ctx, 450, 124, 450, 140, step >= 1 ? color.green : color.line);

  const deployActive = step >= 5;
  ctx.fillStyle = 'rgba(109,127,153,0.10)';
  round(ctx, 34, 188, 70, 24, 12);
  ctx.fill();
  centerText(ctx, '部署出口', 69, 204, 12, color.muted, 900);
  card(ctx, 154, 180, 190, 42, deployActive ? color.green : color.line);
  text(ctx, 'Event mode', 172, 198, 13, color.green, 900);
  text(ctx, '下一事件 → 可变长片段', 172, 216, 11, color.muted, 700);

  card(ctx, 388, 180, 202, 42, deployActive ? color.blue : color.line);
  text(ctx, 'Unified mode', 406, 198, 13, color.blue, 900);
  text(ctx, '全局指令+历史 → 固定 chunk', 406, 216, 11, color.muted, 700);

  card(ctx, 634, 180, 200, 42, deployActive ? color.orange : color.line);
  text(ctx, 'Serving 压缩', 652, 198, 13, color.orange, 900);
  text(ctx, 'DMD + FP8 + CUDA Graph → 10Hz', 652, 216, 11, color.muted, 700);

  arrow(ctx, 356, 170, 264, 180, deployActive ? color.green : color.line);
  arrow(ctx, 450, 170, 489, 180, deployActive ? color.blue : color.line);
  arrow(ctx, 544, 170, 734, 180, deployActive ? color.orange : color.line);
}

function drawArchitecture(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx);
  text(ctx, 'Layer-coupled Video-Action Denoiser', 42, 32, 16, color.text, 900);
  pill(ctx, '事件 caption ce', 34, 54, 116, active === 0 ? color.orange : color.blue2);
  pill(ctx, '状态 s', 408, 54, 82, active === 4 ? color.orange : color.blue2);

  card(ctx, 68, 92, 178, 106, active === 1 ? color.blue : color.line);
  card(ctx, 326, 92, 178, 106, active === 2 ? color.green : color.line);
  centerText(ctx, 'Multi-View Video DiT', 157, 116, 14, active === 1 ? color.blue : color.text, 900);
  centerText(ctx, 'Action Transformer', 415, 116, 14, active === 2 ? color.green : color.text, 900);

  const layerYs = [138, 160, 182];
  layerYs.forEach((y, i) => {
    ctx.fillStyle = active === 1 ? color.blue : '#dbe9fb';
    round(ctx, 92, y - 8, 128, 12, 6);
    ctx.fill();
    ctx.fillStyle = active === 2 ? color.green : '#d9efe5';
    round(ctx, 350, y - 8, 128, 12, 6);
    ctx.fill();
    arrow(ctx, 224, y - 2, 346, y - 2, active === 3 ? color.green : color.line);
    centerText(ctx, `L${i + 1}`, 236, y - 10, 10, color.muted, 800);
  });

  arrow(ctx, 150, 68, 150, 92, active === 0 ? color.orange : color.line);
  arrow(ctx, 448, 68, 448, 92, active === 4 ? color.orange : color.line);
  arrow(ctx, 505, 146, 535, 146, active === 5 ? color.green : color.line);
  centerText(ctx, 'ae', 542, 151, 13, active === 5 ? color.green : color.text, 900);
  text(ctx, '视频塔保留 Wan 先验；动作塔逐层读取视频 KV，输出末端轨迹。', 56, 226, 14, color.muted, 800);
}

function dashedBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke = color.text) {
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  round(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();
}

function drawFrameworkOverview(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx);
  text(ctx, 'Figure 3 总览：从下一事件到未来视频与动作', 34, 30, 16, color.text, 900);
  text(ctx, 'a 决定下一事件，b 把事件变成视频和动作，c 解释多视角 token 如何接到动作塔。', 34, 50, 12, color.muted, 800);

  card(ctx, 34, 70, 170, 76, active === 0 ? color.orange : color.line);
  centerText(ctx, 'a 语言引导推理', 119, 100, 14, active === 0 ? color.orange : color.text, 900);
  pill(ctx, '事件条件', 74, 114, 90, color.orange);
  arrow(ctx, 204, 108, 254, 108, color.orange);

  card(ctx, 256, 62, 270, 92, active === 1 ? color.green : color.line);
  ctx.fillStyle = '#f2ead6';
  round(ctx, 278, 88, 128, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#f1eaf7';
  round(ctx, 418, 88, 86, 42, 10);
  ctx.fill();
  centerText(ctx, 'Multi-View Video DiT', 342, 114, 12, color.text, 900);
  centerText(ctx, 'Action', 461, 106, 12, color.text, 900);
  centerText(ctx, 'Transformer', 461, 122, 12, color.text, 900);
  text(ctx, 'b 事件世界建模', 342, 146, 13, active === 1 ? color.green : color.muted, 900);

  ctx.strokeStyle = '#ccd8e8';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(34, 164);
  ctx.lineTo(526, 164);
  ctx.stroke();
  ctx.setLineDash([]);

  text(ctx, 'c 时空融合', 40, 188, 13, active === 2 ? color.blue : color.muted, 900);
  ['view 1', 'view 2', 'view 3'].forEach((s, i) => text(ctx, s, 42, 208 + i * 14, 11, color.text, 800));

  const yTop = 204;
  const yMid = 218;
  const yBot = 232;
  ctx.strokeStyle = '#e6bd46';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(104, yTop);
  ctx.lineTo(236, yTop);
  ctx.bezierCurveTo(260, yTop, 260, yBot, 290, yBot);
  ctx.bezierCurveTo(320, yBot, 320, yTop, 352, yTop);
  ctx.lineTo(436, yTop);
  ctx.bezierCurveTo(456, yTop, 450, yMid, 486, yMid);
  ctx.stroke();

  ctx.strokeStyle = '#d89573';
  ctx.beginPath();
  ctx.moveTo(104, yMid);
  ctx.lineTo(486, yMid);
  ctx.stroke();

  ctx.strokeStyle = color.blue;
  ctx.beginPath();
  ctx.moveTo(104, yBot);
  ctx.lineTo(236, yBot);
  ctx.bezierCurveTo(260, yBot, 260, yTop, 290, yTop);
  ctx.bezierCurveTo(320, yTop, 320, yBot, 352, yBot);
  ctx.lineTo(436, yBot);
  ctx.bezierCurveTo(456, yBot, 450, yMid, 486, yMid);
  ctx.stroke();

  [96, 290, 438, 486].forEach((x, i) => {
    ctx.strokeStyle = i === active ? color.text : color.line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 194);
    ctx.lineTo(x, 238);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  text(ctx, 'S1', 104, 192, 11, color.orange, 900);
  text(ctx, 'S2', 274, 192, 11, color.blue, 900);
  text(ctx, 'S3', 406, 192, 11, color.muted, 900);
  text(ctx, 'S4 KV to Action', 438, 192, 11, color.orange, 900);
}

function drawFrameworkReasoning(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx);
  text(ctx, 'a) Language-Guided Reasoning：下一事件从哪里来', 34, 30, 16, color.text, 900);
  text(ctx, '两条入口都不是直接输出动作，而是产出 WAM 可使用的事件条件。', 34, 50, 12, color.muted, 800);

  card(ctx, 34, 74, 160, 70, active === 0 ? color.orange : color.line);
  centerText(ctx, 'Text Model', 114, 100, 15, color.text, 900);
  text(ctx, 'VLM / Human / Agent', 62, 122, 11, color.muted, 800);
  text(ctx, 'Event Mode', 42, 158, 12, color.blue, 900);
  text(ctx, 'Nature Language', 42, 174, 12, color.blue, 900);

  card(ctx, 34, 182, 72, 44, active === 1 ? color.blue : color.line);
  centerText(ctx, 'Qwen3.5', 70, 209, 12, color.text, 900);
  card(ctx, 122, 182, 72, 44, active === 1 ? color.orange : color.line);
  centerText(ctx, 'Staircase', 158, 200, 11, color.text, 900);
  centerText(ctx, 'Decoder', 158, 216, 11, color.text, 900);
  text(ctx, 'Unified Mode: Embedding', 42, 240, 12, color.blue, 900);

  dashedBox(ctx, 230, 82, 128, 60, color.orange);
  centerText(ctx, '下一事件文本', 294, 108, 13, color.text, 900);
  text(ctx, 'Grasp knife...', 252, 130, 11, color.muted, 800);
  pill(ctx, 'Embedding', 246, 188, 96, color.orange);
  arrow(ctx, 194, 108, 230, 108, color.orange);
  arrow(ctx, 194, 204, 246, 204, color.orange);

  dashedBox(ctx, 398, 84, 118, 92, active === 2 ? color.blue : color.muted);
  centerText(ctx, 'Historical', 457, 116, 14, color.text, 900);
  centerText(ctx, 'Observations', 457, 138, 14, color.text, 900);
  centerText(ctx, 'Executions', 457, 160, 14, color.text, 900);
  text(ctx, 'ON/OFF', 432, 204, 13, color.text, 900);
  arrow(ctx, 358, 112, 398, 112, color.orange);
  arrow(ctx, 342, 204, 408, 176, color.orange);
  text(ctx, '输出：事件条件进入右侧 Event World Modeling。', 214, 236, 12, color.muted, 800);
}

function drawFrameworkWorld(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx);
  text(ctx, 'b) Event World Modeling：事件如何变成视频和动作', 34, 30, 16, color.text, 900);
  text(ctx, '黄色视频塔建模未来世界，紫色动作塔读取视频特征并生成动作。', 34, 50, 12, color.muted, 800);

  card(ctx, 34, 70, 492, 118, color.text);
  ctx.fillStyle = '#f1e6ca';
  round(ctx, 58, 96, 246, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#efe8f4';
  round(ctx, 318, 96, 184, 56, 10);
  ctx.fill();
  centerText(ctx, 'Multi-View Video DiT', 181, 130, 16, active === 0 ? color.orange : color.text, 900);
  centerText(ctx, 'Action Transformer', 410, 130, 16, active === 1 ? color.purple : color.text, 900);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(310, 124, 20, 0, Math.PI * 2);
  ctx.fill();

  arrow(ctx, 182, 174, 182, 154, active === 0 ? color.orange : color.line);
  arrow(ctx, 410, 174, 410, 154, active === 1 ? color.purple : color.line);
  arrow(ctx, 296, 124, 318, 124, active === 2 ? color.green : color.line);
  text(ctx, 'layer-wise KV', 274, 92, 11, active === 2 ? color.green : color.muted, 800);

  const xs = [58, 112, 166, 220, 274, 328, 382, 436];
  xs.forEach((x, i) => {
    ctx.fillStyle = i < 5 ? '#eee3c7' : '#eee7f4';
    round(ctx, x, 194, 42, 20, 5);
    ctx.fill();
  });
  ctx.strokeStyle = color.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(58, 224);
  ctx.lineTo(304, 224);
  ctx.moveTo(318, 224);
  ctx.lineTo(490, 224);
  ctx.stroke();
  centerText(ctx, 'video latents', 181, 240, 13, color.text, 800);
  centerText(ctx, 'state & action', 404, 240, 13, color.text, 800);
}

function drawFrameworkFusion(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx, WIDE_W, WIDE_H);
  text(ctx, 'S1. Intra-view Attn', 54, 38, 14, active === 0 ? color.orange : '#d89573', 500);
  text(ctx, 'S2. Cross-view Attn', 276, 38, 14, active === 1 ? color.blue : '#6f8bb8', 500);
  text(ctx, 'S3. View Concat', 510, 38, 14, active === 2 ? color.text : color.muted, 500);
  text(ctx, 'S4. Block-wise Coupling KV to Action', 650, 38, 12, active === 3 ? color.orange : '#d89573', 500);
  ['view 1', 'view 2', 'view 3'].forEach((s, i) => text(ctx, s, 42, 80 + i * 24, 13, color.text, 600));

  const y1 = 78;
  const y2 = 104;
  const y3 = 130;
  const xStart = 112;
  const xS2 = 360;
  const xS3 = 620;
  const xS4 = 800;

  ctx.strokeStyle = active === 0 ? color.orange : '#e6bd46';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xStart, y1);
  ctx.lineTo(250, y1);
  ctx.bezierCurveTo(300, y1, 304, y3, xS2, y3);
  ctx.bezierCurveTo(416, y3, 420, y1, 470, y1);
  ctx.lineTo(560, y1);
  ctx.bezierCurveTo(598, y1, 586, y2 - 8, 650, y2 - 8);
  ctx.lineTo(xS4, y2 - 8);
  ctx.stroke();

  ctx.strokeStyle = active === 1 ? color.blue : '#6f8bb8';
  ctx.beginPath();
  ctx.moveTo(xStart, y3);
  ctx.lineTo(250, y3);
  ctx.bezierCurveTo(300, y3, 304, y1, xS2, y1);
  ctx.bezierCurveTo(416, y1, 420, y3, 470, y3);
  ctx.lineTo(560, y3);
  ctx.bezierCurveTo(598, y3, 586, y2 + 8, 650, y2 + 8);
  ctx.lineTo(xS4, y2 + 8);
  ctx.stroke();

  ctx.strokeStyle = '#d89573';
  ctx.beginPath();
  ctx.moveTo(xStart, y2);
  ctx.lineTo(xS4, y2);
  ctx.stroke();

  [104, xS2, xS3, xS4].forEach((x, i) => {
    ctx.strokeStyle = i === active ? color.text : color.line;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.lineTo(x, 152);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  ctx.strokeStyle = '#c8b3d2';
  ctx.lineWidth = 3;
  [0, 1, 2, 3, 4].forEach((i) => {
    ctx.beginPath();
    ctx.moveTo(xS4, y2);
    ctx.bezierCurveTo(830, y2, 822, y2 - 24 + i * 12, 866, y2 - 24 + i * 12);
    ctx.moveTo(xS4, y2 - 8);
    ctx.bezierCurveTo(830, y2 - 8, 822, y2 - 24 + i * 12, 866, y2 - 24 + i * 12);
    ctx.moveTo(xS4, y2 + 8);
    ctx.bezierCurveTo(830, y2 + 8, 822, y2 - 24 + i * 12, 866, y2 - 24 + i * 12);
    ctx.stroke();
  });

  text(ctx, 'views into the batch axis', 44, 182, 12, color.text, 500);
  text(ctx, 'cross-view fusion', 292, 182, 12, color.text, 500);
  text(ctx, 'views tokens along sequence axis', 488, 182, 12, color.text, 500);
  centerText(ctx, 'c) Spatial-Temporal Fusion', 450, 224, 17, color.muted, 700);
}

function drawMultiView(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx);
  const viewXs = [78, 236, 394];
  const labels = ['ego', 'left wrist', 'right wrist'];
  viewXs.forEach((x, i) => {
    card(ctx, x - 48, 42, 96, 92, active >= 1 ? color.blue2 : color.line);
    ctx.fillStyle = '#eef5ff';
    round(ctx, x - 34, 58, 68, 50, 8);
    ctx.fill();
    ctx.strokeStyle = i === 1 && active === 3 ? color.red : color.blue;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color.orange;
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 9, 84, 10, 0, Math.PI * 2);
    ctx.fill();
    if (i === 1 && active === 3) {
      ctx.fillStyle = 'rgba(217,74,95,0.75)';
      round(ctx, x - 20, 68, 40, 32, 6);
      ctx.fill();
    }
    centerText(ctx, labels[i], x, 124, 12, color.muted, 800);
  });

  if (active >= 1) {
    text(ctx, 'Camera RoPE', 44, 28, 13, color.purple, 900);
    viewXs.forEach((x, i) => {
      ctx.strokeStyle = [color.blue, color.purple, color.green][i];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 28, 58, 8, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  if (active >= 2) {
    arrow(ctx, 126, 88, 188, 88, color.green);
    arrow(ctx, 284, 88, 346, 88, color.green);
    ctx.strokeStyle = color.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(112, 54);
    ctx.lineTo(410, 132);
    ctx.stroke();
    ctx.setLineDash([]);
    centerText(ctx, 'sight-cone: 只保留几何可见连线', 280, 162, 13, color.green, 900);
  }

  if (active >= 3) {
    ctx.fillStyle = 'rgba(34,160,107,0.12)';
    round(ctx, 178, 176, 204, 28, 14);
    ctx.fill();
    centerText(ctx, 'tube mask 迫使被遮挡视角从其他相机恢复', 280, 195, 13, color.green, 900);
  }

  if (active === 0) {
    centerText(ctx, '单视角各看各的，遮挡处缺证据', 280, 190, 14, color.red, 900);
  }
  text(ctx, '训练时用几何约束和遮挡恢复；推理时移除 mask，保留学到的跨视角对应。', 46, 226, 13, color.muted, 800);
}

function drawData(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx, WIDE_W, WIDE_H);
  const step = Math.max(0, Math.min(4, active));
  const titles = ['长 episode', '事件切分', '事件 caption', '视频+动作配对', '均衡采样'];
  const xs = [56, 214, 372, 530, 688];
  text(ctx, '示例：拿起黄瓜，放到菜板上', 44, 30, 18, color.text, 900);
  text(ctx, '把一整段长轨迹整理成事件级训练样本：ce + Ve + ae', 44, 52, 13, color.muted, 800);

  xs.forEach((x, i) => {
    ctx.fillStyle = i <= step ? color.green : '#dbe9fb';
    ctx.beginPath();
    ctx.arc(x + 34, 80, 20, 0, Math.PI * 2);
    ctx.fill();
    centerText(ctx, String(i + 1), x + 34, 87, 14, '#fff', 900);
    centerText(ctx, titles[i], x + 34, 118, 12, i === step ? color.green : color.muted, 800);
    if (i < xs.length - 1) arrow(ctx, x + 62, 80, xs[i + 1] - 2, 80, i < step ? color.green : color.line);
  });

  card(ctx, 44, 136, 812, 72, color.line);
  if (step === 0) {
    text(ctx, '原始数据是一整段长时序 episode，不天然知道哪里是“拿”、哪里是“放”。', 70, 164, 13, color.text, 800);
    ctx.strokeStyle = color.line;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(94, 188);
    ctx.lineTo(792, 188);
    ctx.stroke();
    ['靠近黄瓜', '抓住', '抬起', '移动', '放到菜板'].forEach((s, i) => centerText(ctx, s, 130 + i * 160, 194, 11, color.muted, 700));
  } else if (step === 1) {
    text(ctx, '把长轨迹按行为边界切成事件：不是等长切片，而是动作语义闭合。', 70, 164, 13, color.text, 800);
    const segs = [
      ['拿黄瓜', 96, 196, color.green],
      ['移动到菜板', 310, 210, color.blue],
      ['放菜板上', 538, 254, color.orange],
    ] as const;
    segs.forEach(([label, x, w, c], i) => {
      ctx.fillStyle = c + '22';
      round(ctx, x, 178, w, 22, 8);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      centerText(ctx, label, x + w / 2, 194, 12, c, 800);
      if (i > 0) {
        ctx.strokeStyle = color.line;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x - 9, 176);
        ctx.lineTo(x - 9, 204);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  } else if (step === 2) {
    text(ctx, '给每个事件片段配文本 caption，这里的 caption 就是公式里的 ce。', 70, 164, 13, color.text, 800);
    pill(ctx, 'ce1：拿起黄瓜', 106, 180, 116, color.green);
    pill(ctx, 'ce2：移动到菜板', 278, 180, 132, color.blue);
    pill(ctx, 'ce3：放到菜板上', 466, 180, 132, color.orange);
  } else if (step === 3) {
    text(ctx, '每个事件样本同时保存文本、未来视频和动作轨迹，不是只学动作。', 70, 164, 13, color.text, 800);
    const cells = ['事件文本 ce', '事件视频 Ve', '动作轨迹 ae'];
    cells.forEach((s, i) => {
      card(ctx, 112 + i * 220, 178, 150, 24, [color.green, color.blue, color.orange][i]);
      centerText(ctx, s, 187 + i * 220, 195, 12, [color.green, color.blue, color.orange][i], 800);
      if (i < 2) arrow(ctx, 266 + i * 220, 190, 326 + i * 220, 190, color.line);
    });
  } else {
    text(ctx, '最后用双聚类均衡采样，避免大量简单移动淹没接触、失败恢复等长尾事件。', 70, 164, 13, color.text, 800);
    const bubbles = [
      ['简单移动', 20, 190, color.blue],
      ['接触抓取', 15, 374, color.green],
      ['失败恢复', 11, 558, color.orange],
      ['重新对齐', 13, 724, color.purple],
    ] as const;
    bubbles.forEach(([label, r, x, c]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, 192, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      centerText(ctx, label, x, 230, 12, color.text, 800);
    });
  }
}

function drawResults(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx, WIDE_W, WIDE_H);
  text(ctx, 'Section 7.2 真实机器人评测：Task Progress 越高，任务推进越远', 34, 28, 16, color.text, 900);

  const rows = [
    ['多样操作', 'Table 5', 63.0, 75.86, '抓取/放置/倒水：事件预训练给物理先验'],
    ['推理操作', 'Table 5', 59.5, 71.6, '分类/排序/配对：下一事件让语言落地'],
    ['灵巧操作', 'Table 5', 31.25, 32.0, '插线/收纳：提升很小，低层接触仍难'],
    ['泛化', 'Table 5', 28.5, 53.75, '杂乱桌面随机指令：差距最大'],
  ] as const;

  rows.forEach(([name, source, baseScore, eventScore, note], i) => {
    const y = 70 + i * 34;
    const on = i === active;
    text(ctx, name, 34, y + 16, 13, on ? color.blue : color.text, 900);
    text(ctx, source, 92, y + 16, 10, color.muted, 700);
    ctx.fillStyle = on ? 'rgba(217,74,95,0.20)' : '#e3eaf3';
    round(ctx, 156, y + 2, baseScore * 2.6, 10, 5);
    ctx.fill();
    ctx.fillStyle = on ? color.green : '#a8c6ea';
    round(ctx, 156, y + 16, eventScore * 2.6, 10, 5);
    ctx.fill();
    text(ctx, `${eventScore.toFixed(2)}`, 370, y + 25, 11, on ? color.green : color.muted, 800);
    text(ctx, note, 436, y + 22, 11, on ? color.text : color.muted, 700);
  });

  ctx.fillStyle = '#e3eaf3';
  round(ctx, 156, 214, 38, 8, 4);
  ctx.fill();
  text(ctx, '对照/从零', 202, 222, 10, color.muted, 700);
  ctx.fillStyle = color.green;
  round(ctx, 276, 214, 38, 8, 4);
  ctx.fill();
  text(ctx, 'WALL-WM-E 事件模式', 322, 222, 10, color.muted, 700);
}

function drawResultsWins(ctx: CanvasRenderingContext2D, active: number) {
  base(ctx, WIDE_W, WIDE_H);
  text(ctx, 'Table 5 怎么证明 WALL-WM 成功：挑三条最有说服力的结果讲', 34, 28, 16, color.text, 900);
  text(ctx, '每条只讲一个结论：泛化、推理、多样操作分别对应论文主张的三个收益。', 34, 48, 12, color.muted, 800);

  const cards = [
    ['1', '泛化最强', '53.75 vs 28.50', ['杂乱桌面随机指令', '事件知识可复用'], color.orange],
    ['2', '推理有效', '71.60 vs 59.50', ['分类 / 排序 / 配对', '语言目标落成下一事件'], color.blue],
    ['3', '操作更稳', '75.86 vs 63.00', ['抓取 / 放置 / 倒水', '事件预训练带来物理先验'], color.green],
  ] as const;

  cards.forEach(([idx, title, score, points, c], i) => {
    const y = 76 + i * 42;
    const on = i === active;
    card(ctx, 78, y, 744, 34, on ? c : color.line);
    ctx.fillStyle = c + '18';
    round(ctx, 96, y + 8, 30, 18, 9);
    ctx.fill();
    centerText(ctx, idx, 111, y + 22, 12, c, 900);
    text(ctx, title, 148, y + 22, 14, c, 900);
    text(ctx, score, 278, y + 22, 18, c, 900);
    text(ctx, points[0], 460, y + 14, 11, color.text, 800);
    text(ctx, points[1], 460, y + 28, 11, color.muted, 700);
  });

  ctx.fillStyle = 'rgba(217,74,95,0.10)';
  round(ctx, 240, 204, 420, 24, 12);
  ctx.fill();
  centerText(ctx, '边界也要诚实讲：灵巧操作 32.00 vs 31.25，精密接触仍然困难。', 450, 221, 12, color.red, 900);
}

function drawSummary(ctx: CanvasRenderingContext2D, v: number) {
  base(ctx, WIDE_W, WIDE_H);
  text(ctx, '最终判断：WALL-WM 不是万能控制器，而是把学习单位改成事件', 34, 28, 16, color.text, 900);
  text(ctx, '最后一页只做收束：它解决了什么、实验证明了什么、还有什么没解决。', 34, 48, 12, color.muted, 800);

  const panels = [
    ['解决了什么', '固定 chunk 会切碎完整行为', '事件让语言、视频、动作对齐到同一段可执行行为', color.blue],
    ['证明了什么', '推理和泛化任务收益最明显', '多样操作更稳，说明事件预训练带来可复用先验', color.green],
    ['没解决什么', '灵巧操作提升有限', '精密插入、窄容差接触、低层力控仍然困难', color.red],
  ] as const;

  panels.forEach(([title, a, b, c], i) => {
    const x = 42 + i * 286;
    const active = i === v;
    card(ctx, x, 72, 242, 94, active ? c : color.line);
    ctx.fillStyle = c + '18';
    round(ctx, x + 18, 94, 88, 26, 13);
    ctx.fill();
    centerText(ctx, title, x + 62, 112, 13, c, 900);
    text(ctx, a, x + 18, 142, 12, color.text, 800);
    text(ctx, b, x + 18, 160, 10, color.muted, 700);
  });

  ctx.fillStyle = 'rgba(18,104,232,0.08)';
  round(ctx, 116, 192, 668, 30, 15);
  ctx.fill();
  centerText(ctx, '从按固定时钟切 chunk，推进到按语义事件切机器人行为。', 450, 212, 13, color.blue, 900);
}

function drawKind(ctx: CanvasRenderingContext2D, kind: WidgetKind, value: number, t: number, chapterId: string) {
  if (kind === 'heroOld') return drawHero(ctx, 'old', t);
  if (kind === 'heroNew') return drawHero(ctx, 'new', t);
  if (kind === 'analogy') return drawAnalogy(ctx, Number(chapterId.replace('chap-', '')) || 1, t);
  if (kind === 'cut') {
    base(ctx);
    drawCutBoundaryLab(ctx, value < 0.5 ? 'chunk' : 'event', t);
    return;
  }
  if (kind === 'alignment') return drawAlignment(ctx, value);
  if (kind === 'event') return drawEventCheck(ctx, value);
  if (kind === 'objective') return drawObjective(ctx, value);
  if (kind === 'reasoning') return drawReasoning(ctx, Math.round(value));
  if (kind === 'inference') return drawInference(ctx, Math.round(value));
  if (kind === 'training') return drawTraining(ctx, Math.round(value));
  if (kind === 'architecture') return drawArchitecture(ctx, Math.round(value));
  if (kind === 'frameworkOverview') return drawFrameworkOverview(ctx, Math.round(value));
  if (kind === 'frameworkReasoning') return drawFrameworkReasoning(ctx, Math.round(value));
  if (kind === 'frameworkWorld') return drawFrameworkWorld(ctx, Math.round(value));
  if (kind === 'frameworkFusion') return drawFrameworkFusion(ctx, Math.round(value));
  if (kind === 'multiview') return drawMultiView(ctx, Math.round(value));
  if (kind === 'data') return drawData(ctx, Math.round(value));
  if (kind === 'results') return drawResults(ctx, Math.round(value));
  if (kind === 'resultsWins') return drawResultsWins(ctx, Math.round(value));
  return drawSummary(ctx, Math.round(value));
}

const config: Record<WidgetKind, { max: number; labels: string[]; feedback: string[] }> = {
  heroOld: { max: 1, labels: [], feedback: [] },
  heroNew: { max: 1, labels: [], feedback: [] },
  analogy: { max: 1, labels: [], feedback: [] },
  cut: {
    max: 1,
    labels: ['固定 chunk', '语义事件'],
    feedback: ['固定窗口会让 caption、视频、动作落到不完整的局部片段。', '事件边界让三种模态描述同一段完整可执行行为。'],
  },
  alignment: {
    max: 100,
    labels: ['观察角度'],
    feedback: ['低角度：先看三种模态处在不同抽象高度。', '旋转中：视频处在语言和动作之间，但几何仍不相同。', '俯视：三者邻域形状和尺度不同，不能硬压到同一空间。'],
  },
  event: {
    max: 2,
    labels: ['分离', '语言+视频', '三者相加'],
    feedback: ['还不是事件：语言、视频、动作仍是分离条件。', '只连接了语言和视频，还缺动作可执行性。', '三条件全部相加：可作为训练原子。'],
  },
  objective: {
    max: 2,
    labels: ['OpenVLA/π0.5', '传统 WAM', 'WALL-WM'],
    feedback: [
      '普通 VLA：当前单帧视觉 + 语言 -> 固定动作块，只做反应式映射。',
      '传统 WAM：当前观测 + 动作 -> 下一帧观测，只管环境动力学。',
      'WALL-WM：V0、本体状态、事件文本 -> 未来视频 + 完整动作。',
    ],
  },
  reasoning: {
    max: 3,
    labels: ['全局指令', '看局面', '下一事件', '隐推理'],
    feedback: ['任务还太粗。', 'VLM 根据画面判断进度。', '下一事件把目标变成可执行短句。', 'Staircase 用连续隐变量避免逐字推理延迟。'],
  },
  inference: {
    max: 2,
    labels: ['还没拿刀', '刀已拿起', '食物已放好'],
    feedback: ['当前应该生成抓刀事件条件。', '当前应该生成放刀事件条件。', '当前应该生成插花事件条件。'],
  },
  training: {
    max: 5,
    labels: ['视频PT', '动作PT', 'VLM适配', 'Staircase', 'chunk适配', '部署出口'],
    feedback: ['先训练事件视频塔。', '冻结视频塔再训动作塔。', '适配 VLM 到 DiT 条件空间。', '蒸馏并行隐推理。', '可选 fixed-chunk 微调。', '同一主干分成 event/unified 两个推理接口，并用 DMD+FP8 压缩部署。'],
  },
  architecture: {
    max: 5,
    labels: ['caption', '视频塔', '动作塔', '层耦合', '状态', '轨迹'],
    feedback: ['事件文字进入共享条件器。', 'Wan 视频塔保留文生视频先验。', 'Action DiT 负责动作去噪。', '动作塔每层读取对应视频层 KV。', '状态 token 让本体信息持续可达。', '最终输出事件内末端轨迹。'],
  },
  frameworkOverview: {
    max: 2,
    labels: ['a 推理', 'b 建模', 'c 融合'],
    feedback: ['a 负责把任务进度转成下一事件。', 'b 负责把事件变成未来视频和动作。', 'c 负责多视角融合并把视频 KV 送给动作塔。'],
  },
  frameworkReasoning: {
    max: 2,
    labels: ['事件模式', '统一模式', '历史'],
    feedback: ['事件模式用自然语言事件作为条件。', '统一模式用 Qwen3.5 和 Staircase 生成 embedding。', '历史观测和执行告诉模型当前任务进度。'],
  },
  frameworkWorld: {
    max: 2,
    labels: ['视频塔', '动作塔', '层耦合'],
    feedback: ['Multi-View Video DiT 保留视频世界先验。', 'Action Transformer 去噪状态和动作 token。', '动作塔逐层读取视频塔 KV。'],
  },
  frameworkFusion: {
    max: 3,
    labels: ['S1', 'S2', 'S3', 'S4'],
    feedback: ['S1 每个视角先各自做注意力。', 'S2 不同视角之间融合。', 'S3 把视角 token 拼到序列轴。', 'S4 视频 KV 逐层送给动作塔。'],
  },
  multiview: {
    max: 3,
    labels: ['单视角', 'RoPE', '视锥', 'Tube'],
    feedback: ['单视角遇到遮挡时缺少几何补证。', 'Camera RoPE 让模型区分相机身份。', 'sight-cone mask 只允许几何可见区域互相注意。', 'tube mask 遮掉一个视角，逼模型从其他视角恢复。'],
  },
  data: {
    max: 4,
    labels: ['长轨迹', '切事件', '配文本', '配视频动作', '均衡采样'],
    feedback: ['先收集完整长时序 episode。', '按行为边界切成事件片段。', '给每个事件片段配 caption。', '每个事件同时保存视频和动作。', '用均衡采样保护长尾事件。'],
  },
  results: {
    max: 3,
    labels: ['多样', '推理', '灵巧', '泛化'],
    feedback: ['多样操作整体领先。', '推理操作体现事件拆解价值。', '灵巧操作提升小，仍是局限。', '复杂场景泛化拉开差距。'],
  },
  resultsWins: {
    max: 2,
    labels: ['泛化', '推理', '多样'],
    feedback: ['泛化结果最能说明事件知识在杂乱场景中可复用。', '推理结果说明语言目标能落成下一事件。', '多样操作说明事件预训练带来稳定物理先验。'],
  },
  summary: {
    max: 2,
    labels: ['解决', '证明', '局限'],
    feedback: ['WALL-WM 解决的是行为组织单位问题。', '实验主要证明推理、泛化和多样操作更稳。', '灵巧操作提升有限，低层接触仍然困难。'],
  },
};

function FormalWidget({ kind, chapterId, moduleId }: WidgetProps & { kind: WidgetKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isWide = kind === 'frameworkFusion' || kind === 'inference' || kind === 'training' || kind === 'data' || kind === 'results' || kind === 'resultsWins' || kind === 'summary';
  const canvasW = isWide ? WIDE_W : W;
  const canvasH = isWide ? WIDE_H : H;
  const max = config[kind].max;
  const initial = kind === 'objective' ? 0 : kind === 'cut' || kind === 'inference' ? 0 : max > 1 ? 0 : 0.55;
  const stateRef = useRef(initial);
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ active: boolean; x: number; y: number; start: number }>({ active: false, x: 0, y: 0, start: initial });
  const [value, setValue] = useState(initial);

  const feedback = useMemo(() => {
    const f = config[kind].feedback;
    if (!f.length) return null;
    if (max === 100) {
      const idx = value < 0.35 ? 0 : value < 0.68 ? 1 : 2;
      return { text: f[idx], cls: idx === 2 ? 'good' : idx === 0 ? 'bad' : '' };
    }
    const idx = Math.round(value);
    return { text: f[idx] || f[0], cls: kind === 'results' && idx === 2 ? 'bad' : idx >= Math.floor(max / 2) ? 'good' : '' };
  }, [kind, max, value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, canvasW, canvasH);
    } catch {
      return;
    }
    const tick = () => {
      frameRef.current += 1;
      drawKind(ctx, kind, stateRef.current, frameRef.current, chapterId);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [canvasH, canvasW, chapterId, kind]);

  const set = (next: number) => {
    const normalized = max === 100 ? clamp(next, 0, 1) : clamp(Math.round(next), 0, max);
    stateRef.current = normalized;
    setValue(normalized);
  };

  const labels = config[kind].labels;
  const passive = kind === 'heroOld' || kind === 'heroNew' || kind === 'analogy';

  return (
    <div className="wm-widget">
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        onPointerDown={
          kind === 'alignment'
            ? (e) => {
                dragRef.current = { active: true, x: e.clientX, y: e.clientY, start: stateRef.current };
                e.currentTarget.setPointerCapture(e.pointerId);
              }
            : kind === 'event'
              ? (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * canvasW;
                  const y = ((e.clientY - rect.top) / rect.height) * canvasH;
                  if (y >= 96 && y <= 148) {
                    if (x >= 177 && x <= 217) set(1);
                    if (x >= 361 && x <= 401) set(2);
                  }
                }
            : undefined
        }
        onPointerMove={
          kind === 'alignment'
            ? (e) => {
                if (!dragRef.current.active) return;
                const dx = e.clientX - dragRef.current.x;
                const dy = e.clientY - dragRef.current.y;
                set(dragRef.current.start + (dx - dy * 0.55) / 360);
              }
            : undefined
        }
        onPointerUp={
          kind === 'alignment'
            ? (e) => {
                dragRef.current.active = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            : undefined
        }
        onPointerCancel={
          kind === 'alignment'
            ? () => {
                dragRef.current.active = false;
              }
            : undefined
        }
      />
      {!passive && labels.length > 0 ? (
        max <= 5 ? (
          <div className="chip-row">
            {labels.map((label, index) => (
              <button key={label} className={`chip ${Math.round(value) === index ? 'selected' : ''}`} onClick={() => set(index)} type="button">
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="ctrl">
            <label>
              {labels[0]} <span className="val">{Math.round(value * 100)}%</span>
            </label>
            <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={(e) => set(Number(e.target.value) / 100)} />
          </div>
        )
      ) : null}
    </div>
  );
}

export const WmHeroOld: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="heroOld" />;
export const WmHeroNew: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="heroNew" />;
export const WmAnalogy: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="analogy" />;
export const WmCut: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="cut" />;
export const WmAlignment: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="alignment" />;
export const WmEvent: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="event" />;
export const WmObjective: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="objective" />;
export const WmReasoning: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="reasoning" />;
export const WmInference: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="inference" />;
export const WmTraining: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="training" />;
export const WmArchitecture: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="architecture" />;
export const WmFrameworkOverview: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="frameworkOverview" />;
export const WmFrameworkReasoning: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="frameworkReasoning" />;
export const WmFrameworkWorld: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="frameworkWorld" />;
export const WmFrameworkFusion: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="frameworkFusion" />;
export const WmMultiView: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="multiview" />;
export const WmData: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="data" />;
export const WmResults: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="results" />;
export const WmResultsWins: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="resultsWins" />;
export const WmSummary: React.FC<WidgetProps> = (props) => <FormalWidget {...props} kind="summary" />;
