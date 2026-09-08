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
import {
  STORY_COLORS,
  arrow,
  label,
  roundedRect,
} from './storyKit';
import { VIDEO_PALETTE as P } from './videoPalette';

const C = {
  ...STORY_COLORS,
  bg: P.background,
  field: P.surface,
  blue: P.primary,
  green: P.success,
  red: P.error,
  orange: P.warning,
  purple: P.secondary,
  text: P.text,
  muted: P.muted,
  border: P.border,
  paper: P.text,
};

type FamilyId =
  | 'classification'
  | 'zeroShot'
  | 'clustering'
  | 'retrieval'
  | 'pair'
  | 'vcqa';

type CatAction =
  | 'sleep'
  | 'drink'
  | 'jump'
  | 'groom'
  | 'chase'
  | 'box'
  | 'pawBall'
  | 'cup';

type PlaybackState = 'idle' | 'playing' | 'paused' | 'complete';

type Family = {
  label: string;
  english: string;
  count: number;
  color: string;
  contrast: string;
  summary: string;
  interfaceNote: string;
  beats: ReadonlyArray<{ start: number; title: string }>;
};

const DEMO_DURATION = 6200;
const BEAT_STARTS = [0, 1500, 3200, 4750] as const;
const MAIN_CANVAS_SCALE = 1.25;
const MAIN_CANVAS_WIDTH = 560 * MAIN_CANVAS_SCALE;
const MAIN_CANVAS_HEIGHT = 240 * MAIN_CANVAS_SCALE;

const families: Record<FamilyId, Family> = {
  classification: {
    label: '分类',
    english: 'Classification',
    count: 6,
    color: C.blue,
    contrast: P.background,
    summary: '模型先看少量带标签的例子，再判断新视频属于哪一类。',
    interfaceNote: '输入以视频 V 为主。实际协议采用每类 8 个样本的线性探测；表示模型保持冻结，主指标为 Accuracy。',
    beats: [
      { start: 0, title: '先看带标签示例' },
      { start: 1500, title: '冻结模型，学习简单分类器' },
      { start: 3200, title: '送入一段新视频' },
      { start: 4750, title: '输出：跳跃' },
    ],
  },
  zeroShot: {
    label: '零样本分类',
    english: 'Zero-shot Classification',
    count: 2,
    color: C.purple,
    contrast: '#F5F5F5',
    summary: '这里没有带标签的训练视频。模型直接比较视频和各个类别名称的距离。',
    interfaceNote: '需要联合视频—文本表示空间；类别提示词按数据集设计，主指标为 Accuracy。',
    beats: [
      { start: 0, title: '只有一段待测视频' },
      { start: 1500, title: '读入候选类别文字' },
      { start: 3200, title: '比较视频与文字距离' },
      { start: 4750, title: '输出：舔毛' },
    ],
  },
  clustering: {
    label: '聚类',
    english: 'Clustering',
    count: 2,
    color: C.green,
    contrast: P.background,
    summary: '不预先告诉模型类别，只看相似视频能否聚到一起。',
    interfaceNote: '实际使用 MiniBatchKMeans，k 设为真实类别数；聚类过程不使用类别监督，主指标为 V-measure。',
    beats: [
      { start: 0, title: '读入一堆无标签视频' },
      { start: 1500, title: '把视频变成表示点' },
      { start: 3200, title: '相似内容彼此靠近' },
      { start: 4750, title: '形成三个自然分组' },
    ],
  },
  retrieval: {
    label: '检索',
    english: 'Retrieval',
    count: 10,
    color: C.orange,
    contrast: P.background,
    summary: '给模型一条查询，看它能否把最相关的视频排在前面。',
    interfaceNote: '动画只演示 T→V；MVEB 实际覆盖 8 种文本、音频、视频有序方向，主指标为 nDCG@10。',
    beats: [
      { start: 0, title: '输入一条文字查询' },
      { start: 1500, title: '查看候选视频' },
      { start: 3200, title: '按相关程度重新排序' },
      { start: 4750, title: '目标视频来到 Top 1' },
    ],
  },
  pair: {
    label: '成对分类',
    english: 'Pair Classification',
    count: 2,
    color: C.red,
    contrast: P.background,
    summary: '这道题不要求给两段视频命名，只判断它们是否满足同一个关系。',
    interfaceNote: '判据随数据集变化，例如同一活动或同一说话者；使用余弦相似度并报告 max-AP。',
    beats: [
      { start: 0, title: '先看第一段视频' },
      { start: 1500, title: '再看另一角度的视频' },
      { start: 3200, title: '比较两段视频的表示' },
      { start: 4750, title: '输出：同一种活动' },
    ],
  },
  vcqa: {
    label: '视频问答',
    english: 'Video-centric QA',
    count: 1,
    color: C.purple,
    contrast: '#F5F5F5',
    summary: '模型同时读取视频和问题，再从候选答案中找出最匹配的一项。',
    interfaceNote: 'MVEB 将其实现为问题专属候选池中的检索，而不是自由生成答案；主指标为 Accuracy。',
    beats: [
      { start: 0, title: '播放猫咪碰倒杯子的视频' },
      { start: 1500, title: '读入问题' },
      { start: 3200, title: '检查三个候选答案' },
      { start: 4750, title: '输出：蓝色杯子' },
    ],
  },
};

const familyOrder: FamilyId[] = [
  'classification',
  'zeroShot',
  'clustering',
  'retrieval',
  'pair',
  'vcqa',
];

function segment(
  time: number,
  start: number,
  end: number,
  easing: (value: number) => number = easeOutCubic,
) {
  return easing(clamp((time - start) / Math.max(1, end - start), 0, 1));
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return '00:' + String(seconds).padStart(2, '0');
}

function drawWithAlpha(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  draw: () => void,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha, 0, 1);
  draw();
  ctx.restore();
}

function drawArrowReveal(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  reveal: number,
) {
  drawWithAlpha(ctx, reveal, () => arrow(ctx, fromX, fromY, toX, toY, color, 2.5));
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  color: string,
  reveal = 1,
) {
  drawWithAlpha(ctx, reveal, () => {
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, width, 30, 15);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x + width / 2, y + 15, color, 'center', '800 11px "Microsoft YaHei", sans-serif');
  });
}

function drawPaletteSeal(ctx: CanvasRenderingContext2D, x: number, y: number, text = '✓') {
  ctx.fillStyle = P.surface;
  ctx.strokeStyle = P.success;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, text, x, y + 0.5, P.text, 'center', '800 10px "Segoe UI", sans-serif');
}

function drawModelBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  title: string,
  subtitle: string,
  color: string,
  reveal: number,
  pulse: number,
  reducedMotion: boolean,
) {
  drawWithAlpha(ctx, reveal, () => {
    const scale = reducedMotion ? 1 : 1 + Math.sin(pulse * Math.PI * 2) * 0.018;
    ctx.translate(x + width / 2, y + 24);
    ctx.scale(scale, scale);
    ctx.translate(-(x + width / 2), -(y + 24));
    ctx.fillStyle = P.surface;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, width, 48, 12);
    ctx.fill();
    ctx.stroke();
    label(ctx, title, x + width / 2, y + 18, C.paper, 'center', '800 10px "Segoe UI", sans-serif');
    label(ctx, subtitle, x + width / 2, y + 34, P.muted, 'center', '650 9px "Microsoft YaHei", sans-serif');
  });
}

function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  action: CatAction,
  progress: number,
  reducedMotion: boolean,
) {
  const cycle = reducedMotion ? 0.35 : progress;
  const bounce = action === 'jump'
    ? -Math.sin(clamp(cycle, 0, 1) * Math.PI) * 12 * scale
    : action === 'chase' || action === 'pawBall'
      ? Math.sin(cycle * Math.PI * 4) * 1.5 * scale
      : 0;
  ctx.save();
  ctx.translate(x, y + bounce);

  ctx.strokeStyle = '#c47d38';
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14 * scale, 3 * scale);
  ctx.bezierCurveTo(
    28 * scale,
    (-8 + Math.sin(cycle * Math.PI * 3) * 5) * scale,
    31 * scale,
    10 * scale,
    22 * scale,
    14 * scale,
  );
  ctx.stroke();

  ctx.fillStyle = '#eaa45b';
  ctx.beginPath();
  ctx.ellipse(2 * scale, 8 * scale, 19 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9b5b2c';
  ctx.lineWidth = 1.3 * scale;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-10 * scale, -5 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-19 * scale, -12 * scale);
  ctx.lineTo(-17 * scale, -25 * scale);
  ctx.lineTo(-9 * scale, -16 * scale);
  ctx.moveTo(-7 * scale, -16 * scale);
  ctx.lineTo(1 * scale, -24 * scale);
  ctx.lineTo(1 * scale, -10 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#624125';
  ctx.lineWidth = 1.2 * scale;
  if (action === 'sleep') {
    ctx.beginPath();
    ctx.arc(-14 * scale, -5 * scale, 3 * scale, 0.1, Math.PI - 0.1);
    ctx.arc(-6 * scale, -5 * scale, 3 * scale, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#263244';
    ctx.beginPath();
    ctx.arc(-14 * scale, -5 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.arc(-6 * scale, -5 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#9b5b2c';
  ctx.beginPath();
  ctx.moveTo(-20 * scale, 0);
  ctx.lineTo(-29 * scale, -3 * scale);
  ctx.moveTo(-20 * scale, 3 * scale);
  ctx.lineTo(-29 * scale, 5 * scale);
  ctx.moveTo(0, 0);
  ctx.lineTo(9 * scale, -3 * scale);
  ctx.moveTo(0, 3 * scale);
  ctx.lineTo(9 * scale, 6 * scale);
  ctx.stroke();

  if (action === 'groom') {
    const pawY = (-1 + Math.sin(cycle * Math.PI * 4) * 2) * scale;
    ctx.strokeStyle = '#9b5b2c';
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(2 * scale, 8 * scale);
    ctx.lineTo(-4 * scale, pawY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneProps(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  action: CatAction,
  progress: number,
  reducedMotion: boolean,
) {
  ctx.fillStyle = action === 'sleep' ? '#ded7ef' : action === 'drink' ? '#d8eef2' : '#e7eddc';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.22, Math.max(10, width * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aec59c';
  ctx.fillRect(0, height * 0.68, width, height * 0.32);

  if (action === 'sleep') {
    ctx.fillStyle = '#8c78ae';
    ctx.beginPath();
    ctx.ellipse(width * 0.52, height * 0.69, width * 0.3, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (action === 'drink') {
    ctx.fillStyle = '#57a4bd';
    roundedRect(ctx, width * 0.15, height * 0.64, width * 0.27, height * 0.13, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.2, height * 0.67);
    ctx.lineTo(width * 0.35, height * 0.67);
    ctx.stroke();
  }
  if (action === 'jump') {
    ctx.fillStyle = '#8a5b3c';
    ctx.fillRect(width * 0.66, height * 0.49, width * 0.22, height * 0.2);
    ctx.fillStyle = '#b9835b';
    ctx.fillRect(width * 0.62, height * 0.45, width * 0.3, height * 0.06);
  }
  if (action === 'box') {
    ctx.fillStyle = '#b97940';
    ctx.fillRect(width * 0.58, height * 0.48, width * 0.3, height * 0.27);
    ctx.strokeStyle = '#805027';
    ctx.strokeRect(width * 0.58, height * 0.48, width * 0.3, height * 0.27);
  }
  if (action === 'chase' || action === 'pawBall') {
    const ballOffset = reducedMotion ? 0 : Math.sin(progress * Math.PI * 2) * width * 0.06;
    ctx.fillStyle = '#d65454';
    ctx.beginPath();
    ctx.arc(width * 0.7 + ballOffset, height * 0.69, Math.max(4, width * 0.055), 0, Math.PI * 2);
    ctx.fill();
  }
  if (action === 'cup') {
    const fall = easeInOutQuad(clamp((progress - 0.35) / 0.5, 0, 1));
    const drawCup = (angle: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(width * 0.7, height * 0.58);
      ctx.rotate(angle);
      ctx.fillStyle = '#4388ce';
      roundedRect(ctx, -width * 0.055, -height * 0.13, width * 0.11, height * 0.18, 3);
      ctx.fill();
      ctx.restore();
    };
    if (reducedMotion) {
      drawCup(0, 1 - fall);
      drawCup(1.15, fall);
    } else {
      drawCup(fall * 1.15, 1);
    }
  }
}

function drawVideoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  action: CatAction,
  title: string,
  accent: string,
  reveal: number,
  progress: number,
  active: boolean,
  reducedMotion: boolean,
) {
  if (reveal <= 0) return;
  const lift = reducedMotion ? 0 : (1 - reveal) * 10;
  ctx.save();
  ctx.globalAlpha *= clamp(reveal, 0, 1);
  ctx.translate(x, y + lift);
  roundedRect(ctx, 0, 0, width, height, 8);
  ctx.clip();
  drawSceneProps(ctx, width, height - 18, action, progress, reducedMotion);

  let catX = width * 0.48;
  let catY = height * 0.55;
  if (action === 'drink') catX = width * 0.55;
  if (action === 'box') catX = width * 0.46;
  if (action === 'cup') catX = width * 0.35;
  const catScale = Math.max(0.52, Math.min(1.1, width / 115));
  drawCat(ctx, catX, catY, catScale, action, progress, reducedMotion);

  ctx.fillStyle = 'rgba(12,20,34,.84)';
  ctx.fillRect(0, height - 19, width, 19);
  label(ctx, title, 7, height - 9.5, C.paper, 'left', '700 8.5px "Microsoft YaHei", sans-serif');
  label(ctx, '00:04', width - 6, height - 9.5, P.text, 'right', '700 7px "Segoe UI", sans-serif');
  if (active) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, height - 2.5, width * clamp(progress, 0.08, 1), 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(8, 18);
    ctx.lineTo(16, 13);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= clamp(reveal, 0, 1);
  ctx.translate(x, y + lift);
  ctx.strokeStyle = active ? accent : P.muted;
  ctx.lineWidth = active ? 2.5 : 1.2;
  roundedRect(ctx, 0, 0, width, height, 8);
  ctx.stroke();
  ctx.restore();
}

function drawMovieChrome(
  ctx: CanvasRenderingContext2D,
  family: Family,
  elapsed: number,
) {
  ctx.clearRect(0, 0, 560, 240);
  ctx.fillStyle = P.background;
  ctx.fillRect(0, 0, 560, 240);
  ctx.fillStyle = P.surface;
  ctx.fillRect(0, 0, 560, 29);
  ['#ef6a67', '#e8b858', '#6ec28b'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(15 + index * 14, 14.5, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  label(ctx, family.english, 58, 14.5, P.text, 'left', '800 9px "Segoe UI", sans-serif');
  label(ctx, 'MVEB TASK STORY', 544, 14.5, P.muted, 'right', '750 8px "Segoe UI", sans-serif');

  ctx.fillStyle = P.surface;
  ctx.fillRect(0, 208, 560, 32);
  const progress = clamp(elapsed / DEMO_DURATION, 0, 1);
  ctx.fillStyle = P.border;
  ctx.fillRect(18, 230, 524, 3);
  ctx.fillStyle = family.color;
  ctx.fillRect(18, 230, 524 * progress, 3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(20, 215);
  ctx.lineTo(20, 225);
  ctx.lineTo(28, 220);
  ctx.closePath();
  ctx.fill();
  label(ctx, formatTime(elapsed) + ' / 00:06', 540, 220, P.muted, 'right', '700 8px "Cascadia Code", monospace');
}

function drawClassification(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  label(ctx, '先看几个带标签的视频', 20, 42, P.text, 'left', '700 10px "Microsoft YaHei", sans-serif');
  const samples: Array<{ x: number; action: CatAction; title: string }> = [
    { x: 20, action: 'sleep', title: '睡觉' },
    { x: 103, action: 'drink', title: '喝水' },
    { x: 186, action: 'jump', title: '跳跃' },
  ];
  samples.forEach((sample, index) => {
    const reveal = segment(elapsed, -500 + index * 150, index * 150);
    drawVideoCard(
      ctx,
      sample.x,
      55,
      72,
      80,
      sample.action,
      sample.title,
      C.blue,
      reveal,
      clamp((elapsed - index * 240) / 1700, 0, 1),
      elapsed < 2300,
      reducedMotion,
    );
  });
  const modelReveal = segment(elapsed, 1450, 2050);
  drawArrowReveal(ctx, 263, 95, 291, 95, C.blue, modelReveal);
  drawModelBlock(
    ctx,
    295,
    70,
    104,
    'VIDEO MODEL',
    '记住类别线索',
    C.blue,
    modelReveal,
    elapsed / 850,
    reducedMotion,
  );

  const queryReveal = segment(elapsed, 3050, 3600);
  drawArrowReveal(ctx, 438, 95, 402, 95, C.orange, queryReveal);
  drawVideoCard(
    ctx,
    442,
    55,
    84,
    80,
    'jump',
    '新视频',
    C.orange,
    queryReveal,
    clamp((elapsed - 3150) / 1900, 0, 1),
    elapsed >= 3000,
    reducedMotion,
  );
  drawPill(ctx, '分类结果：跳跃', 425, 153, 118, C.green, segment(elapsed, 4650, 5250));
  drawWithAlpha(ctx, segment(elapsed, 5150, 5550), () => drawPaletteSeal(ctx, 528, 49, '✓'));
}

function drawZeroShot(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  label(ctx, '没有参考视频，也不训练新分类器', 20, 42, P.text, 'left', '700 10px "Microsoft YaHei", sans-serif');
  drawVideoCard(
    ctx,
    24,
    56,
    165,
    116,
    'groom',
    '待测视频',
    C.purple,
    segment(elapsed, 80, 650),
    clamp(elapsed / 2600, 0, 1),
    true,
    reducedMotion,
  );
  drawModelBlock(
    ctx,
    214,
    86,
    91,
    'MATCH',
    '视频 ↔ 文字',
    C.purple,
    segment(elapsed, 1200, 1800),
    elapsed / 900,
    reducedMotion,
  );
  drawArrowReveal(ctx, 190, 113, 211, 113, C.purple, segment(elapsed, 1350, 1900));

  const labels = ['猫咪睡觉', '猫咪喝水', '猫咪舔毛'];
  labels.forEach((text, index) => {
    const reveal = segment(elapsed, 1450 + index * 240, 1900 + index * 240);
    const selected = index === 2 && elapsed >= 4550;
    drawWithAlpha(ctx, reveal, () => {
      ctx.fillStyle = selected ? 'rgba(26,127,100,.28)' : P.surfaceRaised;
      ctx.strokeStyle = selected ? C.purple : P.border;
      ctx.lineWidth = selected ? 2.5 : 1.2;
      roundedRect(ctx, 334, 55 + index * 42, 188, 31, 8);
      ctx.fill();
      ctx.stroke();
      label(ctx, text, 350, 70 + index * 42, P.text, 'left', '750 10px "Microsoft YaHei", sans-serif');
      const lineReveal = segment(elapsed, 3050 + index * 240, 3500 + index * 240);
      ctx.fillStyle = selected ? C.purple : P.muted;
      ctx.fillRect(458, 68 + index * 42, (index === 2 ? 48 : 20 + index * 6) * lineReveal, 4);
    });
  });
  drawArrowReveal(ctx, 306, 112, 330, 112, C.purple, segment(elapsed, 3000, 3600));
  drawPill(ctx, '零样本判断：舔毛', 356, 176, 150, C.green, segment(elapsed, 4700, 5250));
}

function drawClustering(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  label(ctx, '所有视频都没有类别标签', 20, 42, P.text, 'left', '700 10px "Microsoft YaHei", sans-serif');
  const items: Array<{ action: CatAction; target: [number, number]; color: string }> = [
    { action: 'sleep', target: [329, 65], color: C.purple },
    { action: 'drink', target: [411, 65], color: C.blue },
    { action: 'chase', target: [493, 65], color: C.orange },
    { action: 'sleep', target: [329, 125], color: C.purple },
    { action: 'drink', target: [411, 125], color: C.blue },
    { action: 'chase', target: [493, 125], color: C.orange },
  ];
  const sources: Array<[number, number]> = [
    [22, 57],
    [93, 57],
    [164, 57],
    [22, 121],
    [93, 121],
    [164, 121],
  ];
  const moveRaw = segment(elapsed, 3000, 4450, easeInOutQuad);
  const move = reducedMotion ? (moveRaw > 0.55 ? 1 : 0) : moveRaw;

  drawWithAlpha(ctx, segment(elapsed, 1300, 1900) * (1 - moveRaw), () => {
    drawModelBlock(ctx, 244, 84, 72, 'EMBED', '无标签', C.green, 1, elapsed / 900, reducedMotion);
  });

  items.forEach((item, index) => {
    const reveal = segment(elapsed, 100 + index * 130, 500 + index * 130);
    const source = sources[index];
    const drawAt = (x: number, y: number, width: number, height: number, alpha: number) => {
      drawVideoCard(
        ctx,
        x,
        y,
        width,
        height,
        item.action,
        '',
        item.color,
        reveal * alpha,
        clamp(elapsed / 2100, 0, 1),
        elapsed < 2500,
        reducedMotion,
      );
    };
    if (reducedMotion) {
      drawAt(source[0], source[1], 62, 52, 1 - moveRaw);
      drawAt(item.target[0], item.target[1], 58, 48, moveRaw);
    } else {
      drawAt(
        lerp(source[0], item.target[0], move),
        lerp(source[1], item.target[1], move),
        move > 0.15 ? 58 : 62,
        move > 0.15 ? 48 : 52,
        1,
      );
    }
  });

  const groupReveal = segment(elapsed, 4450, 5050);
  ['组 A', '组 B', '组 C'].forEach((text, index) => {
    const color = [C.purple, C.blue, C.orange][index];
    drawWithAlpha(ctx, groupReveal, () => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      roundedRect(ctx, 320 + index * 82, 53, 74, 126, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, text, 357 + index * 82, 190, color, 'center', '800 10px "Microsoft YaHei", sans-serif');
    });
  });
  drawArrowReveal(ctx, 218, 109, 241, 109, C.green, segment(elapsed, 1300, 1900) * (1 - moveRaw));
  drawArrowReveal(ctx, 317, 109, 339, 109, C.green, segment(elapsed, 2200, 2900) * (1 - moveRaw));
}

function drawRetrieval(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  const typed = '橘猫跳进纸箱';
  const typedCount = Math.floor(typed.length * segment(elapsed, 100, 1150));
  drawWithAlpha(ctx, segment(elapsed, 50, 350), () => {
    ctx.fillStyle = P.surfaceRaised;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, 20, 39, 280, 32, 9);
    ctx.fill();
    ctx.stroke();
    label(ctx, '⌕  ' + typed.slice(0, typedCount), 34, 55, P.text, 'left', '750 10px "Microsoft YaHei", sans-serif');
  });

  const actions: CatAction[] = ['sleep', 'drink', 'box', 'chase'];
  const titles = ['猫咪睡觉', '猫咪喝水', '跳进纸箱', '追红球'];
  const originalX = [24, 157, 290, 423];
  const finalX = [157, 290, 24, 423];
  const reorderRaw = segment(elapsed, 3150, 4450, easeInOutQuad);
  const reorder = reducedMotion ? (reorderRaw > 0.55 ? 1 : 0) : reorderRaw;
  actions.forEach((action, index) => {
    const reveal = segment(elapsed, 1350 + index * 170, 1800 + index * 170);
    const drawAt = (x: number, alpha: number) => drawVideoCard(
      ctx,
      x,
      89,
      112,
      91,
      action,
      titles[index],
      index === 2 ? C.orange : C.blue,
      reveal * alpha,
      clamp((elapsed - 1300 - index * 120) / 2200, 0, 1),
      index === 2 && elapsed >= 2800,
      reducedMotion,
    );
    if (reducedMotion) {
      drawAt(originalX[index], 1 - reorderRaw);
      drawAt(finalX[index], reorderRaw);
    } else {
      drawAt(lerp(originalX[index], finalX[index], reorder), 1);
    }
    const x = reducedMotion ? finalX[index] : lerp(originalX[index], finalX[index], reorder);
    if (elapsed >= 4500) {
      const rank = [2, 3, 1, 4][index];
      drawPill(ctx, '#' + rank, x + 72, 78, 32, rank === 1 ? C.green : C.muted, segment(elapsed, 4500, 5000));
    }
  });
  const scan = segment(elapsed, 2450, 3200, easeInOutQuad);
  drawWithAlpha(ctx, scan * (1 - reorderRaw), () => {
    ctx.fillStyle = 'rgba(217,119,6,.16)';
    ctx.fillRect(reducedMotion ? 290 : 24 + scan * 399, 82, 12, 105);
  });
  drawPill(ctx, 'Top 1 · 最相关结果', 356, 42, 174, C.green, segment(elapsed, 4750, 5300));
}

function drawPair(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  label(ctx, '判断：是否为同一种活动？', 20, 42, P.text, 'left', '700 10px "Microsoft YaHei", sans-serif');
  drawVideoCard(
    ctx,
    30,
    58,
    150,
    112,
    'pawBall',
    '机位 A',
    C.red,
    segment(elapsed, 80, 650),
    clamp(elapsed / 2600, 0, 1),
    true,
    reducedMotion,
  );
  drawVideoCard(
    ctx,
    380,
    58,
    150,
    112,
    'pawBall',
    '机位 B',
    C.red,
    segment(elapsed, 1400, 2050),
    clamp((elapsed - 1300) / 2600, 0, 1),
    elapsed >= 1400,
    reducedMotion,
  );
  drawModelBlock(
    ctx,
    222,
    82,
    116,
    'COMPARE',
    '比较两段视频',
    C.red,
    segment(elapsed, 2850, 3450),
    elapsed / 900,
    reducedMotion,
  );
  drawArrowReveal(ctx, 181, 112, 218, 112, C.red, segment(elapsed, 2900, 3450));
  drawArrowReveal(ctx, 378, 112, 342, 112, C.red, segment(elapsed, 2900, 3450));
  const verdict = segment(elapsed, 4650, 5250);
  drawPill(ctx, '是 · 同一种活动', 213, 151, 134, C.green, verdict);
  drawWithAlpha(ctx, verdict, () => drawPaletteSeal(ctx, 360, 166, '✓'));
}

function drawQa(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  reducedMotion: boolean,
) {
  drawVideoCard(
    ctx,
    22,
    45,
    228,
    142,
    'cup',
    '猫咪走过桌面',
    C.purple,
    segment(elapsed, 80, 650),
    clamp(elapsed / 3000, 0, 1),
    true,
    reducedMotion,
  );
  drawWithAlpha(ctx, segment(elapsed, 1350, 1950), () => {
    label(ctx, '问题', 282, 50, P.muted, 'left', '800 9px "Microsoft YaHei", sans-serif');
    label(ctx, '猫咪碰倒了什么？', 282, 69, P.text, 'left', '800 12px "Microsoft YaHei", sans-serif');
  });
  const answers = ['蓝色杯子', '红色球', '纸箱'];
  answers.forEach((answer, index) => {
    const reveal = segment(elapsed, 2650 + index * 220, 3100 + index * 220);
    const selected = index === 0 && elapsed >= 4550;
    drawWithAlpha(ctx, reveal, () => {
      ctx.fillStyle = selected ? 'rgba(16,163,127,.26)' : P.surfaceRaised;
      ctx.strokeStyle = selected ? C.green : P.border;
      ctx.lineWidth = selected ? 2.5 : 1.2;
      roundedRect(ctx, 282, 87 + index * 35, 238, 27, 7);
      ctx.fill();
      ctx.stroke();
      label(ctx, String.fromCharCode(65 + index) + '  ' + answer, 296, 100.5 + index * 35, P.text, 'left', '750 10px "Microsoft YaHei", sans-serif');
    });
  });
  drawWithAlpha(ctx, segment(elapsed, 4700, 5250), () => drawPaletteSeal(ctx, 530, 100.5, '✓'));
}

function drawTaskDemo(
  ctx: CanvasRenderingContext2D,
  familyId: FamilyId,
  elapsed: number,
  reducedMotion: boolean,
) {
  const family = families[familyId];
  const time = clamp(elapsed, 0, DEMO_DURATION);
  drawMovieChrome(ctx, family, time);
  if (familyId === 'classification') drawClassification(ctx, time, reducedMotion);
  if (familyId === 'zeroShot') drawZeroShot(ctx, time, reducedMotion);
  if (familyId === 'clustering') drawClustering(ctx, time, reducedMotion);
  if (familyId === 'retrieval') drawRetrieval(ctx, time, reducedMotion);
  if (familyId === 'pair') drawPair(ctx, time, reducedMotion);
  if (familyId === 'vcqa') drawQa(ctx, time, reducedMotion);
}

function beatIndexAt(familyId: FamilyId, elapsed: number) {
  const beats = families[familyId].beats;
  let index = 0;
  for (let candidate = 1; candidate < beats.length; candidate += 1) {
    if (elapsed < beats[candidate].start) break;
    index = candidate;
  }
  return index;
}

function FamilyAnalogy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 244, 130);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | null = null;
    let began = performance.now();
    const paint = (now: number) => {
      const reduced = media.matches;
      const elapsed = reduced ? 3300 : (now - began) % 4300;
      ctx.clearRect(0, 0, 244, 130);
      ctx.fillStyle = P.background;
      ctx.fillRect(0, 0, 244, 130);
      label(ctx, '三段示例 → 一个新判断', 12, 13, P.text, 'left', '750 8px "Microsoft YaHei", sans-serif');
      const actions: CatAction[] = ['sleep', 'drink', 'jump'];
      actions.forEach((action, index) => {
        drawVideoCard(
          ctx,
          10 + index * 56,
          26,
          49,
          55,
          action,
          ['睡觉', '喝水', '跳跃'][index],
          C.blue,
          segment(elapsed, index * 220, 550 + index * 220),
          clamp((elapsed - index * 150) / 1400, 0, 1),
          elapsed < 1800,
          reduced,
        );
      });
      drawArrowReveal(ctx, 174, 54, 193, 54, C.orange, segment(elapsed, 1600, 2200));
      drawPill(ctx, '跳跃', 184, 40, 51, C.green, segment(elapsed, 2450, 3050));
      label(ctx, '点开六类任务，逐段看懂', 234, 111, P.muted, 'right', '700 8px "Microsoft YaHei", sans-serif');
      canvas.classList.add('is-ready');
      if (!reduced) frame = requestAnimationFrame(paint);
    };
    const start = () => {
      began = performance.now();
      if (frame === null) frame = requestAnimationFrame(paint);
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label="三段带标签的猫咪视频进入模型，一段新视频随后得到跳跃分类结果。"
    />
  );
}

function FamilyMain({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const runningRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const familyIdRef = useRef<FamilyId>('classification');
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const playbackStateRef = useRef<PlaybackState>('idle');
  const beatIndexRef = useRef(0);
  const paintRef = useRef<(elapsed: number) => void>(() => {});
  const startLoopRef = useRef<() => void>(() => {});
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);
  const [familyId, setFamilyId] = useState<FamilyId>('classification');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, MAIN_CANVAS_WIDTH, MAIN_CANVAS_HEIGHT);
    ctx.scale(MAIN_CANVAS_SCALE, MAIN_CANVAS_SCALE);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = media.matches;

    const paint = (elapsed: number) => {
      const activeFamily = familyIdRef.current;
      drawTaskDemo(ctx, activeFamily, elapsed, reducedMotionRef.current);
      canvas.classList.add('is-ready');
      const progress = clamp(elapsed / DEMO_DURATION, 0, 1);
      if (progressFillRef.current) progressFillRef.current.style.transform = 'scaleX(' + progress + ')';
      if (progressTrackRef.current) {
        progressTrackRef.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
      if (timeRef.current) {
        timeRef.current.textContent = formatTime(elapsed) + ' / 00:06';
      }
      const nextBeat = beatIndexAt(activeFamily, elapsed);
      if (nextBeat !== beatIndexRef.current) {
        beatIndexRef.current = nextBeat;
        setBeatIndex(nextBeat);
      }
    };
    paintRef.current = paint;

    const frame = (now: number) => {
      frameRef.current = null;
      if (playbackStateRef.current !== 'playing' || !visibleRef.current || document.hidden) {
        runningRef.current = false;
        return;
      }
      const elapsed = clamp(now - startedAtRef.current, 0, DEMO_DURATION);
      elapsedRef.current = elapsed;
      paint(elapsed);
      if (elapsed >= DEMO_DURATION) {
        runningRef.current = false;
        playbackStateRef.current = 'complete';
        setPlaybackState('complete');
        return;
      }
      frameRef.current = requestAnimationFrame(frame);
      runningRef.current = true;
    };
    const startLoop = () => {
      if (
        frameRef.current === null
        && playbackStateRef.current === 'playing'
        && visibleRef.current
        && !document.hidden
      ) {
        frameRef.current = requestAnimationFrame(frame);
        runningRef.current = true;
      }
    };
    startLoopRef.current = startLoop;

    const suspendLoop = () => {
      if (playbackStateRef.current === 'playing' && runningRef.current) {
        elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, DEMO_DURATION);
      }
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      runningRef.current = false;
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
      if (document.hidden) suspendLoop();
      else if (playbackStateRef.current === 'playing' && visibleRef.current) {
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
      runningRef.current = false;
      disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      media.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  const playFamily = (nextFamily: FamilyId) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    runningRef.current = false;
    familyIdRef.current = nextFamily;
    elapsedRef.current = 0;
    startedAtRef.current = performance.now();
    beatIndexRef.current = 0;
    playbackStateRef.current = 'playing';
    setFamilyId(nextFamily);
    setBeatIndex(0);
    setPlaybackState('playing');
    paintRef.current(0);
    startLoopRef.current();
  };

  const togglePlayback = () => {
    if (playbackStateRef.current === 'playing') {
      elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, DEMO_DURATION);
      playbackStateRef.current = 'paused';
      setPlaybackState('paused');
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      runningRef.current = false;
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

  const replay = () => {
    playFamily(familyIdRef.current);
  };

  const family = families[familyId];
  const beat = family.beats[beatIndex] ?? family.beats[0];
  const playLabel = playbackState === 'playing'
    ? 'Ⅱ 暂停'
    : playbackState === 'complete'
      ? '↻ 重新播放'
      : playbackState === 'paused'
        ? '▶ 继续播放'
        : '▶ 播放示例';

  return (
    <div
      className="story-widget task-demo-player"
      data-status={playbackState}
      style={{
        '--task-demo-color': family.color,
        '--task-demo-contrast': family.contrast,
      } as React.CSSProperties}
    >
      <div className="task-demo-heading">
        <span>③ DEFINE THE ABILITIES</span>
        <strong>{family.label}｜{beat.title}</strong>
      </div>
      <div className="chip-row task-demo-tabs" role="group" aria-label="选择一个任务示例">
        {familyOrder.map((id) => (
          <button
            key={id}
            id={'task-family-explorer-family-' + (id === 'zeroShot' ? 'zero-shot' : id)}
            type="button"
            aria-pressed={familyId === id}
            className={'chip ' + (familyId === id ? 'selected' : '')}
            onClick={() => playFamily(id)}
          >
            {families[id].label}
          </button>
        ))}
      </div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={MAIN_CANVAS_WIDTH}
        height={MAIN_CANVAS_HEIGHT}
        role="img"
        aria-label={family.label + '任务示例。当前画面：' + beat.title + '。' + family.summary}
      />
      <div
        ref={progressTrackRef}
        className="task-demo-progress"
        role="progressbar"
        aria-label={family.label + '示例播放进度'}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div ref={progressFillRef} className="task-demo-progress-fill" />
        <div className="task-demo-cues" aria-hidden="true">
          {BEAT_STARTS.slice(1).map((start) => (
            <i key={start} style={{ left: (start / DEMO_DURATION) * 100 + '%' }} />
          ))}
        </div>
      </div>
      <div className="task-demo-controls">
        <button type="button" className="tiny" onClick={togglePlayback}>{playLabel}</button>
        <button
          id="task-family-explorer-reset"
          type="button"
          className="tiny ghost"
          onClick={replay}
        >
          从头再看
        </button>
        <strong aria-live="polite">{beat.title}</strong>
        <time ref={timeRef}>00:00 / 00:06</time>
      </div>
      <p className="task-demo-summary">{family.summary}</p>
      <p className="task-demo-interface-note">
        <strong>评测接口：</strong>{family.interfaceNote}
      </p>
    </div>
  );
}

export const TaskFamilyExplorer: React.FC<WidgetProps> = (props) => (
  props.moduleId === 'ana' ? <FamilyAnalogy /> : <FamilyMain {...props} />
);

export default TaskFamilyExplorer;
