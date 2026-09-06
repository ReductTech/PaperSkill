import React, { useEffect, useRef, useState } from 'react';
import {
  clamp,
  easeInOutQuad,
  easeOutCubic,
  lerp,
  observeCanvas,
  setupCanvas,
} from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  field: '#e8eee2',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

const TASKS = [
  { label: 'Classification', color: C.blue },
  { label: 'Retrieval', color: C.orange },
  { label: 'QA', color: C.purple },
  { label: 'Clustering', color: C.green },
  { label: 'Zero-shot', color: C.red },
  { label: 'Pair', color: '#92400e' },
] as const;

const MOVIE_DURATION = 12_000;

type PlaybackState = 'idle' | 'playing' | 'paused' | 'complete';

const MOVIE_BEATS = [
  {
    start: 0,
    title: 'Model A 发言',
    feedback: '蓝｜Model A 正在陈述 Classification 单项优势。先听完这句局部结论。',
    feedbackClass: '',
    tone: 'blue',
  },
  {
    start: 2300,
    title: 'Model B 入场',
    feedback: '紫｜Model B 从右侧进入，把只谈分类的 Model A 推向左侧。',
    feedbackClass: '',
    tone: 'purple',
  },
  {
    start: 3400,
    title: 'Model B 发言',
    feedback: '紫｜新的声明变成 QA 最强，但它仍然只覆盖一类能力。',
    feedbackClass: '',
    tone: 'purple',
  },
  {
    start: 5300,
    title: 'NO：否定单项外推',
    feedback: '红｜NO：单项最强，不等于通用视频 embedding 最强。',
    feedbackClass: 'bad',
    tone: 'red',
  },
  {
    start: 7100,
    title: '集合所有模型',
    feedback: '蓝｜先把所有候选模型放到同一个评测入口。',
    feedbackClass: '',
    tone: 'blue',
  },
  {
    start: 7750,
    title: '建立评测路径',
    feedback: '蓝｜箭头建立共同路径：同一批模型都要进入 MVEB。',
    feedbackClass: '',
    tone: 'blue',
  },
  {
    start: 8200,
    title: 'MVEB 出现',
    feedback: '绿｜MVEB 提供共同评测入口，而不是让模型自行挑选强项。',
    feedbackClass: 'good',
    tone: 'green',
  },
  {
    start: 9000,
    title: '六类指标依次就位',
    feedback: '绿｜六类任务逐项出现；每类原始指标仍按自己的协议解释。',
    feedbackClass: 'good',
    tone: 'green',
  },
  {
    start: 10_800,
    title: '综合评测完成',
    feedback: '绿｜现在才能讨论综合能力：所有模型都接受六类任务的完整检查。',
    feedbackClass: 'good',
    tone: 'green',
  },
] as const;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 9,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = C.field;
  ctx.beginPath();
  ctx.ellipse(width / 2, height + 18, width * 0.68, height * 0.34, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  align: CanvasTextAlign = 'center',
  font = '700 12px "Segoe UI", "Microsoft YaHei", sans-serif',
  maxWidth?: number,
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

function segment(time: number, start: number, end: number, easing: (value: number) => number = easeOutCubic) {
  return easing(clamp((time - start) / Math.max(1, end - start), 0, 1));
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  color: string,
  filled = false,
) {
  ctx.fillStyle = filled ? color : C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - width / 2, y - 14, width, 28, 14);
  ctx.fill();
  ctx.stroke();
  label(ctx, text, x, y, filled ? C.white : color, 'center', '800 10px "Segoe UI", sans-serif', width - 12);
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
  mouthOpen = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = C.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -31);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -34, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.white;
  roundRect(ctx, -26, -24, 52, 42, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-10, -5, 4, 0, Math.PI * 2);
  ctx.arc(10, -5, 4, 0, Math.PI * 2);
  ctx.fill();
  if (mouthOpen > 0) {
    ctx.beginPath();
    ctx.ellipse(0, 9, 7, 2 + mouthOpen * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(0, 14, 8, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawModelCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  name: string,
  color: string,
  award: string,
  talk = 0,
  alpha = 1,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();
  drawRobot(ctx, x + width / 2, y + 57, color, 0.9, talk);
  label(ctx, name, x + width / 2, y + 100, C.text, 'center', '800 12px "Segoe UI", "Microsoft YaHei", sans-serif');
  drawPill(ctx, award, x + width / 2, y + height - 20, Math.min(width - 20, 112), color, true);
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  claim: string,
  detail: string,
  color: string,
  pointer: 'left' | 'right',
  reveal: number,
  alpha: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();

  const pointY = y + height * 0.62;
  ctx.fillStyle = C.white;
  ctx.beginPath();
  if (pointer === 'left') {
    ctx.moveTo(x + 1, pointY - 10);
    ctx.lineTo(x - 16, pointY);
    ctx.lineTo(x + 1, pointY + 10);
  } else {
    ctx.moveTo(x + width - 1, pointY - 10);
    ctx.lineTo(x + width + 16, pointY);
    ctx.lineTo(x + width - 1, pointY + 10);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const count = Math.ceil(clamp(reveal, 0, 1) * claim.length);
  const visibleClaim = claim.slice(0, count);
  label(ctx, visibleClaim, x + width / 2, y + 32, color, 'center', '850 25px "Segoe UI", "Microsoft YaHei", sans-serif', width - 28);
  ctx.globalAlpha *= segment(reveal, 0.76, 1);
  label(ctx, detail, x + width / 2, y + 65, C.muted, 'center', '700 11px "Segoe UI", "Microsoft YaHei", sans-serif', width - 28);
  ctx.restore();
}

function speakingAmount(time: number, start: number, end: number) {
  if (time < start || time > end) return 0;
  return 0.35 + 0.65 * ((Math.sin((time - start) / 78) + 1) / 2);
}

function drawVoiceBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number,
  alpha: number,
  direction: 1 | -1,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let index = 0; index < 3; index += 1) {
    const height = 5 + ((Math.sin(time / 92 + index * 1.4) + 1) / 2) * 9;
    const barX = x + direction * index * 7;
    ctx.beginPath();
    ctx.moveTo(barX, y - height / 2);
    ctx.lineTo(barX, y + height / 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMotionStreaks(ctx: CanvasRenderingContext2D, x: number, progress: number) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.sin(progress * Math.PI) * 0.7;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  [88, 112, 136].forEach((y, index) => {
    ctx.beginPath();
    ctx.moveTo(x + 158 + index * 5, y);
    ctx.lineTo(x + 194 + index * 8, y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawNo(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean, alpha: number) {
  if (alpha <= 0) return;
  const grow = segment(time, 5300, 6250);
  const scale = reducedMotion ? 1 : lerp(0.62, 1, grow);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(280, 130);
  ctx.scale(scale, scale);
  ctx.translate(-280, -130);
  label(ctx, 'NO', 280, 98, C.red, 'center', '950 72px "Arial Black", "Segoe UI", sans-serif');
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(218, 137);
  ctx.lineTo(342, 137);
  ctx.stroke();
  ctx.globalAlpha *= segment(time, 5650, 6150);
  label(ctx, '单项冠军 ≠ 通用能力', 280, 169, C.text, 'center', '850 21px "Microsoft YaHei", sans-serif');
  ctx.restore();
}

function drawPrelude(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean) {
  const sceneAlpha = 1 - segment(time, 6800, 7250);
  if (sceneAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= sceneAlpha;

  const pushRaw = clamp((time - 2300) / 1100, 0, 1);
  const push = easeInOutQuad(pushRaw);
  const noPush = segment(time, 5500, 6600, easeInOutQuad);
  const reducedModelFade = reducedMotion ? 1 - segment(time, 5500, 6200) : 1;
  const modelFade = (1 - segment(time, 6250, 6850)) * reducedModelFade;
  const aBaseX = reducedMotion ? (time < 2300 ? 52 : -12) : lerp(52, -12, push);
  const bBaseX = reducedMotion ? 358 : lerp(575, 358, push);
  const aX = reducedMotion ? aBaseX : lerp(aBaseX, -188, noPush);
  const bX = reducedMotion ? bBaseX : lerp(bBaseX, 574, noPush);
  const bAlpha = (reducedMotion ? segment(time, 2300, 2700) : time >= 2300 ? 1 : 0) * modelFade;

  const aTalk = speakingAmount(time, 350, 2050);
  const bTalk = speakingAmount(time, 3700, 5050);
  drawModelCard(ctx, aX, 58, 150, 148, 'Model A', C.blue, 'Classification #1', aTalk, modelFade);
  if (!reducedMotion) drawMotionStreaks(ctx, bBaseX, pushRaw);
  drawModelCard(ctx, bX, 58, 150, 148, 'Model B', C.purple, 'QA #1', bTalk, bAlpha);

  const aBubbleAlpha = segment(time, 80, 360) * (1 - segment(time, 2050, 2350));
  const aReveal = segment(time, 350, 1750);
  drawSpeechBubble(
    ctx,
    230,
    75,
    274,
    94,
    '“我是分类最强！”',
    'Classification #1',
    C.blue,
    'left',
    aReveal,
    aBubbleAlpha,
  );
  drawVoiceBars(ctx, 218, 121, C.blue, time, aTalk * aBubbleAlpha, -1);

  const bBubbleAlpha = segment(time, 3400, 3700) * (1 - segment(time, 5050, 5350));
  const bReveal = segment(time, 3700, 4850);
  drawSpeechBubble(
    ctx,
    56,
    75,
    274,
    94,
    '“我是 QA 最强！”',
    'QA #1',
    C.purple,
    'right',
    bReveal,
    bBubbleAlpha,
  );
  drawVoiceBars(ctx, 342, 121, C.purple, time, bTalk * bBubbleAlpha, 1);

  const noAlpha = segment(time, 5300, 5550) * (1 - segment(time, 6650, 7100));
  drawNo(ctx, time, reducedMotion, noAlpha);
  ctx.restore();
}

function drawAllModels(ctx: CanvasRenderingContext2D, alpha: number, offsetX: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(offsetX, 0);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 22, 60, 136, 144, 16);
  ctx.fill();
  ctx.stroke();
  label(ctx, 'ALL MODELS', 90, 79, C.text, 'center', '850 10px "Segoe UI", sans-serif');
  const modelColors = [C.blue, C.purple, C.orange];
  ['A', 'B', '…'].forEach((model, index) => {
    const y = 108 + index * 36;
    ctx.fillStyle = modelColors[index];
    ctx.beginPath();
    ctx.arc(55, y, 12, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, model, 55, y, C.white, 'center', '850 10px "Segoe UI", sans-serif');
    label(ctx, index < 2 ? `Model ${model}` : '更多模型', 77, y, C.muted, 'left', '700 10px "Segoe UI", "Microsoft YaHei", sans-serif');
  });
  ctx.restore();
}

function drawArrowProgress(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress <= 0) return;
  const fromX = 166;
  const toX = 195;
  const currentX = lerp(fromX, toX, progress);
  ctx.strokeStyle = C.blue;
  ctx.fillStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, 132);
  ctx.lineTo(currentX, 132);
  ctx.stroke();
  if (progress > 0.72) {
    ctx.beginPath();
    ctx.moveTo(currentX, 132);
    ctx.lineTo(currentX - 8, 127);
    ctx.lineTo(currentX - 8, 137);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMvebGate(ctx: CanvasRenderingContext2D, alpha: number, scale: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(262, 132);
  ctx.scale(scale, scale);
  ctx.translate(-262, -132);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  roundRect(ctx, 198, 64, 128, 136, 20);
  ctx.fill();
  ctx.stroke();
  label(ctx, 'MVEB', 262, 111, C.blue, 'center', '900 26px "Segoe UI", sans-serif');
  label(ctx, '六类能力', 262, 143, C.green, 'center', '850 14px "Microsoft YaHei", sans-serif');
  label(ctx, '共同评测入口', 262, 170, C.muted, 'center', '700 10px "Microsoft YaHei", sans-serif');
  ctx.restore();
}

function drawFinale(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean) {
  if (time < 6900) return;
  const allModels = segment(time, 7100, 7650);
  const allModelsOffset = reducedMotion ? 0 : -14 * (1 - allModels);
  drawAllModels(ctx, allModels, allModelsOffset);

  const arrow = segment(time, 7750, 8250, easeInOutQuad);
  drawArrowProgress(ctx, arrow);

  const mveb = segment(time, 8200, 8750);
  drawMvebGate(ctx, mveb, reducedMotion ? 1 : lerp(0.95, 1, mveb));

  const brace = segment(time, 8800, 9200);
  ctx.save();
  ctx.globalAlpha *= brace;
  label(ctx, '{', 348, 132, C.green, 'center', '400 140px Georgia, "Times New Roman", serif');
  ctx.restore();

  const positions = [
    { x: 414, y: 78, width: 96 },
    { x: 510, y: 78, width: 84 },
    { x: 414, y: 132, width: 96 },
    { x: 510, y: 132, width: 84 },
    { x: 414, y: 186, width: 96 },
    { x: 510, y: 186, width: 84 },
  ];
  TASKS.forEach((task, index) => {
    const reveal = segment(time, 9150 + index * 250, 9500 + index * 250);
    if (reveal <= 0) return;
    const position = positions[index];
    const offsetX = reducedMotion ? 0 : 12 * (1 - reveal);
    const scale = reducedMotion ? 1 : lerp(0.96, 1, reveal);
    ctx.save();
    ctx.globalAlpha *= reveal;
    ctx.translate(position.x + offsetX, position.y);
    ctx.scale(scale, scale);
    ctx.translate(-position.x, -position.y);
    drawPill(ctx, task.label, position.x, position.y, position.width, task.color);
    ctx.restore();
  });

  const conclusion = segment(time, 10_800, 11_350);
  ctx.save();
  ctx.globalAlpha *= conclusion;
  label(ctx, '所有模型 × 六类任务 = 更完整的能力证据', 280, 238, C.green, 'center', '850 11px "Microsoft YaHei", sans-serif', 530);
  ctx.restore();
}

function drawMovie(ctx: CanvasRenderingContext2D, elapsed: number, reducedMotion: boolean) {
  const time = clamp(elapsed, 0, MOVIE_DURATION);
  clearScene(ctx, 560, 260);
  if (time < 7250) drawPrelude(ctx, time, reducedMotion);
  drawFinale(ctx, time, reducedMotion);
}

function drawCompactStory(ctx: CanvasRenderingContext2D, progress: number) {
  const p = clamp(progress, 0, 1);
  const center = { x: 122, y: 64 };
  const initial = [
    [28, 24], [214, 24], [20, 72], [224, 74], [60, 108], [185, 108],
  ] as const;
  clearScene(ctx, 244, 130);

  TASKS.forEach((task, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / TASKS.length);
    const dockX = center.x + Math.cos(angle) * 39;
    const dockY = center.y + Math.sin(angle) * 37;
    const x = initial[index][0] + (dockX - initial[index][0]) * p;
    const y = initial[index][1] + (dockY - initial[index][1]) * p;
    if (p > 0.25) {
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(center.x, center.y);
      ctx.stroke();
    }
    ctx.fillStyle = task.color;
    ctx.beginPath();
    ctx.arc(x, y, p > 0.7 ? 4 : 6, 0, Math.PI * 2);
    ctx.fill();
    if (p < 0.7) label(ctx, task.label.slice(0, 4), x, y + 11, C.muted, 'center', '700 8px "Segoe UI", sans-serif');
  });

  if (p > 0.38) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, 'MVEB', center.x, center.y, C.blue, 'center', '850 14px "Segoe UI", sans-serif');
  }
  label(ctx, p < 0.48 ? '碎片化' : '统一评测', 122, 121, p < 0.48 ? C.red : C.green, 'center', '850 10px "Microsoft YaHei", sans-serif');
}

function HeroMethodFigure({ variant }: { variant: 'old' | 'new' }) {
  if (variant === 'old') {
    return (
      <figure className="hero-method-figure" aria-label="传统评测把六类任务分散在互不连通的 benchmark 中，各自报告局部结果。">
        <svg viewBox="0 0 320 172" role="img" aria-hidden="true">
          <g className="hero-figure-grid">
            <path d="M16 54H304M16 104H304" />
            <path d="M106 24V148M213 24V148" />
          </g>

          {[
            { x: 18, y: 30, id: 'B₁', task: 'CLS', metric: 'Accuracy' },
            { x: 113, y: 30, id: 'B₂', task: 'RET', metric: 'nDCG@10' },
            { x: 220, y: 30, id: 'B₃', task: 'QA', metric: 'Accuracy' },
            { x: 18, y: 90, id: 'B₄', task: 'CLU', metric: 'V-measure' },
            { x: 113, y: 90, id: 'B₅', task: 'ZS', metric: 'Accuracy' },
            { x: 220, y: 90, id: 'B₆', task: 'PAIR', metric: 'max-AP' },
          ].map((item) => (
            <g className="hero-silo" key={item.id} transform={`translate(${item.x} ${item.y})`}>
              <text className="hero-figure-id" x="0" y="0">{item.id}</text>
              <rect x="0" y="7" width="82" height="48" />
              <text className="hero-figure-task" x="10" y="25">{item.task}</text>
              <path d="M45 25H60" />
              <path d="m57 21 5 4-5 4" />
              <circle cx="70" cy="25" r="4" />
              <text className="hero-figure-metric" x="10" y="45">{item.metric}</text>
            </g>
          ))}

          <path className="hero-figure-separator" d="M18 151H302" />
          <text className="hero-figure-note" x="160" y="166">independent protocols · partial evidence</text>
        </svg>
      </figure>
    );
  }

  const heads = ['CLS', 'ZS', 'CLU', 'RET', 'PAIR', 'QA'].map((label, index) => ({
    x: 232,
    y: 17 + index * 23,
    label,
  }));

  return (
    <figure className="hero-method-figure" aria-label="MVEB 让同一批 33 个模型经过统一协议，并在六类任务上分别使用对应指标。">
      <svg viewBox="0 0 320 172" role="img" aria-hidden="true">
        <text className="hero-figure-id" x="18" y="24">MODEL SET</text>
        <rect className="hero-model-set" x="18" y="42" width="58" height="78" />
        <text className="hero-model-count" x="47" y="74">33</text>
        <text className="hero-figure-metric" x="47" y="94" textAnchor="middle">models</text>
        <path className="hero-flow-line" d="M76 81H103" />
        <path className="hero-flow-line" d="m98 76 6 5-6 5" />

        <rect className="hero-protocol" x="106" y="34" width="78" height="94" />
        <text className="hero-protocol-name" x="145" y="70">MVEB</text>
        <text className="hero-figure-metric" x="145" y="91" textAnchor="middle">shared protocol</text>
        <text className="hero-figure-metric" x="145" y="106" textAnchor="middle">23 tasks</text>

        <path className="hero-flow-line" d="M184 81H202M202 26V141" />
        {heads.map((head) => {
          const centerY = head.y + 9;
          return (
            <g className="hero-task-head" key={head.label}>
              <path className="hero-flow-line" d={`M202 ${centerY}H232`} />
              <rect x={head.x} y={head.y} width="68" height="18" />
              <text x={head.x + 34} y={head.y + 12}>{head.label}</text>
            </g>
          );
        })}

        <path className="hero-figure-separator" d="M18 148H302" />
        <text className="hero-figure-note" x="160" y="163">shared coverage · task-specific metrics</text>
      </svg>
    </figure>
  );
}

function AnalogySmallScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 244, 130);
    const progress = 0.82;
    const draw = () => {
      drawCompactStory(ctx, progress);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {});
    draw();
    return disconnect;
  }, []);

  return <canvas ref={canvasRef} width={244} height={130} role="img" aria-label="六类任务被组织到中央 MVEB 综合评测体系。" />;
}

function SmallScene({ variant }: { variant: 'ana' | 'old' | 'new' }) {
  if (variant === 'ana') return <AnalogySmallScene />;
  return <HeroMethodFigure variant={variant} />;
}

function beatIndexAt(elapsed: number) {
  let index = 0;
  for (let candidate = 1; candidate < MOVIE_BEATS.length; candidate += 1) {
    if (elapsed < MOVIE_BEATS[candidate].start) break;
    index = candidate;
  }
  return index;
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `00:${String(seconds).padStart(2, '0')}`;
}

function MainComparison({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const playbackStateRef = useRef<PlaybackState>('idle');
  const beatIndexRef = useRef(0);
  const paintRef = useRef<(elapsed: number) => void>(() => {});
  const startLoopRef = useRef<() => void>(() => {});
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 260);
    contextRef.current = ctx;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = media.matches;

    const paint = (elapsed: number) => {
      drawMovie(ctx, elapsed, reducedMotionRef.current);
      canvas.classList.add('is-ready');
      const progress = clamp(elapsed / MOVIE_DURATION, 0, 1);
      if (progressFillRef.current) progressFillRef.current.style.transform = `scaleX(${progress})`;
      if (progressTrackRef.current) {
        progressTrackRef.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
      if (timeRef.current) timeRef.current.textContent = `${formatTime(elapsed)} / ${formatTime(MOVIE_DURATION)}`;
      const nextBeat = beatIndexAt(elapsed);
      if (nextBeat !== beatIndexRef.current) {
        beatIndexRef.current = nextBeat;
        setBeatIndex(nextBeat);
      }
    };
    paintRef.current = paint;

    const frame = (now: number) => {
      frameRef.current = null;
      if (
        playbackStateRef.current !== 'playing'
        || !visibleRef.current
        || document.hidden
      ) return;
      const elapsed = clamp(now - startedAtRef.current, 0, MOVIE_DURATION);
      elapsedRef.current = elapsed;
      paint(elapsed);
      if (elapsed >= MOVIE_DURATION) {
        playbackStateRef.current = 'complete';
        setPlaybackState('complete');
        return;
      }
      frameRef.current = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (
        frameRef.current === null
        && playbackStateRef.current === 'playing'
        && visibleRef.current
        && !document.hidden
      ) {
        frameRef.current = requestAnimationFrame(frame);
      }
    };
    startLoopRef.current = startLoop;

    const suspendLoop = () => {
      if (playbackStateRef.current === 'playing') {
        elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, MOVIE_DURATION);
      }
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };

    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        paint(elapsedRef.current);
        if (playbackStateRef.current === 'playing') {
          startedAtRef.current = performance.now() - elapsedRef.current;
          startLoop();
        }
      },
      () => {
        suspendLoop();
        visibleRef.current = false;
      },
    );

    const onVisibilityChange = () => {
      if (document.hidden) {
        suspendLoop();
      } else if (playbackStateRef.current === 'playing' && visibleRef.current) {
        startedAtRef.current = performance.now() - elapsedRef.current;
        startLoop();
      }
    };
    const onPreferenceChange = () => {
      reducedMotionRef.current = media.matches;
      paint(elapsedRef.current);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    media.addEventListener('change', onPreferenceChange);
    paint(0);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      media.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  const togglePlayback = () => {
    if (playbackStateRef.current === 'playing') {
      elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, MOVIE_DURATION);
      playbackStateRef.current = 'paused';
      setPlaybackState('paused');
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      paintRef.current(elapsedRef.current);
      return;
    }

    if (playbackStateRef.current === 'complete') {
      elapsedRef.current = 0;
      beatIndexRef.current = 0;
      setBeatIndex(0);
      paintRef.current(0);
    }
    startedAtRef.current = performance.now() - elapsedRef.current;
    playbackStateRef.current = 'playing';
    setPlaybackState('playing');
    startLoopRef.current();
  };

  const resetPlayback = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    elapsedRef.current = 0;
    beatIndexRef.current = 0;
    playbackStateRef.current = 'idle';
    setBeatIndex(0);
    setPlaybackState('idle');
    paintRef.current(0);
  };

  const beat = MOVIE_BEATS[beatIndex];
  const playLabel = playbackState === 'playing'
    ? 'Ⅱ 暂停'
    : playbackState === 'complete'
      ? '↻ 重新播放'
      : playbackState === 'paused'
        ? '▶ 继续播放'
        : '▶ 播放故事';

  return (
    <div
      className="fragmentation-movie"
      data-status={playbackState}
      data-tone={beat.tone}
    >
      <div className="fragmentation-movie-heading">
        <span>① WHY MVEB</span>
        <strong>{beat.title}</strong>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={560}
        height={260}
        role="img"
        aria-label={`MVEB 连续动画。当前段落：${beat.title}。${beat.feedback}`}
      />

      <div
        ref={progressTrackRef}
        className="fragmentation-movie-progress"
        role="progressbar"
        aria-label="动画播放进度"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div ref={progressFillRef} className="fragmentation-movie-progress-fill" />
        <div className="fragmentation-movie-cues" aria-hidden="true">
          {MOVIE_BEATS.slice(1).map((item) => (
            <i key={item.start} style={{ left: `${(item.start / MOVIE_DURATION) * 100}%` }} />
          ))}
        </div>
      </div>

      <div className="fragmentation-movie-controls">
        <button className="tiny" type="button" onClick={togglePlayback}>
          {playLabel}
        </button>
        <button
          className="tiny ghost"
          type="button"
          onClick={resetPlayback}
          disabled={playbackState === 'idle'}
        >
          回到开头
        </button>
        <strong aria-live="polite">{beat.title}</strong>
        <time ref={timeRef}>00:00 / 00:12</time>
      </div>

      <div className={`feedback ${beat.feedbackClass}`} role="status" aria-live="polite">
        {beat.feedback}
      </div>
    </div>
  );
}

export const FragmentationCompare: React.FC<WidgetProps> = (props) => {
  if (props.moduleId === 'ana') return <SmallScene variant="ana" />;
  if (props.chapterId === 'hero' && props.moduleId === 'old') return <SmallScene variant="old" />;
  if (props.chapterId === 'hero' && props.moduleId === 'new') return <SmallScene variant="new" />;
  return <MainComparison {...props} />;
};

export default FragmentationCompare;
