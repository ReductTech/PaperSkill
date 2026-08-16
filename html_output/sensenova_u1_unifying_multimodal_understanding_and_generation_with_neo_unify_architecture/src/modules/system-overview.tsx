import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C } from './studio-kit';

const W = 1080;
const H = 700;
const STAGE_COUNT = 6;

type Route = 'understanding' | 'generation' | 'joint';
type Point = { x: number; y: number };
type PacketKind = 'text' | 'image' | 'noise' | 'state' | 'loss';

const stageNames = ['输入', '编码', '统一序列', '主干', '输出头', '任务输出'];

const routeName: Record<Route, string> = {
  understanding: '理解数据流',
  generation: '生成数据流',
  joint: '联合训练数据流',
};

const routeTone: Record<Route, string> = {
  understanding: C.current,
  generation: C.aux,
  joint: C.success,
};

const routePayload: Record<Route, string[]> = {
  understanding: ['问题文本 + 干净图像', '词 token + 图像 token', '统一干净序列', '上下文化隐藏状态', '词表 logits', '自回归文本'],
  generation: ['文本条件 + 噪声状态', '条件 token + 噪声 token', '条件—噪声统一序列', '去噪隐藏状态', '预测像素 patch', '生成图像'],
  joint: ['文本 + 图像 + 噪声样本', '三类训练 token', '统一训练序列', '双流隐藏状态', '词预测 + 像素预测', 'CE + MSE 与梯度'],
};

const routeStageCopy: Record<Route, string[]> = {
  understanding: [
    '输入：问题文本与干净图像进入模型；噪声分支不参与理解推理。',
    '编码：文本经原分词器与词嵌入；每个 32×32 图像块经两层卷积变成一个视觉 token。',
    '合流：文本与图像 token 按 T/H/W 编码位置，并组成同一条干净序列。',
    '主干：序列逐层共享注意力上下文；理解 token 使用自己的投影、Norm 与 FFN 参数。',
    '输出：理解线性头把隐藏状态映射到词表 logits。',
    '闭环：LightLLM 自回归输出下一个词；训练时对应语言预测交叉熵。',
  ],
  generation: [
    '输入：文本提供条件，噪声像素提供生成起点；X2I 时还可加入干净图像上下文。',
    '编码：文本变为条件 token；噪声像素按 32×32 patch 变为生成 token。',
    '合流：条件与噪声 token 进入同一序列；噪声可读取干净上下文，反向信息流被阻断。',
    '主干：生成 token 共享序列注意力上下文，但使用生成流专属的投影、Norm 与 FFN。',
    '输出：生成 MLP 头直接把隐藏状态还原为预测像素 patch。',
    '闭环：LightX2V 反复执行像素去噪；双 CFG 控制条件，DMD2 将报告设置压缩到 8 NFE。',
  ],
  joint: [
    '输入：训练批次可以同时包含文本、干净图像与噪声状态，分别支持理解和生成目标。',
    '编码：文本走词嵌入，图像与噪声共用轻量 patch 编码器，三类数据被转换为 token。',
    '合流：三类 token 进入同一序列；Native RoPE 编码位置，混合掩码规定可见性。',
    '主干：两条流在每层交换注意力上下文，同时保留各自的投影、Norm 与 FFN 参数。',
    '输出：理解线性头产生词预测，生成 MLP 头产生像素预测。',
    '闭环：语言 CE 与像素流匹配 MSE 同时计算，并把梯度送回各自分支以协同优化。',
  ],
};

const packetStyle: Record<PacketKind, { color: string; label: string }> = {
  text: { color: C.current, label: '文' },
  image: { color: C.success, label: '图' },
  noise: { color: C.aux, label: '噪' },
  state: { color: C.control, label: '态' },
  loss: { color: C.failure, label: '∇' },
};

function label(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string = C.text, size = 13, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string, active: boolean, fill: string = C.white) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = active ? C.control : stroke;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

function pathArrow(ctx: CanvasRenderingContext2D, points: Point[], color: string, active: boolean, dashed = false) {
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const angle = Math.atan2(last.y - previous.y, last.x - previous.x);
  ctx.save();
  ctx.globalAlpha = active ? 0.92 : 0.22;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 3 : 1.5;
  if (dashed) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(last.x - 10 * Math.cos(angle - 0.48), last.y - 10 * Math.sin(angle - 0.48));
  ctx.lineTo(last.x - 10 * Math.cos(angle + 0.48), last.y - 10 * Math.sin(angle + 0.48));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pointOnPath(points: Point[], progress: number) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let distance = Math.max(0, Math.min(1, progress)) * total;
  let index = 0;
  while (index < lengths.length - 1 && distance > lengths[index]) {
    distance -= lengths[index];
    index += 1;
  }
  const start = points[index];
  const end = points[index + 1];
  const ratio = lengths[index] ? distance / lengths[index] : 0;
  return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
}

function flowPacket(ctx: CanvasRenderingContext2D, points: Point[], progress: number, kind: PacketKind) {
  const position = pointOnPath(points, progress);
  const spec = packetStyle[kind];
  ctx.save();
  ctx.shadowColor = spec.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = C.white;
  ctx.strokeStyle = spec.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(position.x - 15, position.y - 12, 30, 24, 7);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  label(ctx, spec.label, position.x, position.y + 4, spec.color, 11, 'center');
  ctx.restore();
}

function legendItem(ctx: CanvasRenderingContext2D, x: number, y: number, kind: PacketKind, text: string, dashed = false) {
  const color = packetStyle[kind].color;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 24, y);
  ctx.stroke();
  ctx.restore();
  label(ctx, text, x + 31, y + 4, color, 10.5);
}

function drawStageRail(ctx: CanvasRenderingContext2D, stage: number, tone: string) {
  const startX = 54;
  const gap = 194;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, 84);
  ctx.lineTo(startX + gap * 5, 84);
  ctx.stroke();
  ctx.strokeStyle = tone;
  ctx.beginPath();
  ctx.moveTo(startX, 84);
  ctx.lineTo(startX + gap * stage, 84);
  ctx.stroke();
  stageNames.forEach((name, index) => {
    const x = startX + index * gap;
    ctx.fillStyle = index === stage ? C.control : index < stage ? tone : C.white;
    ctx.strokeStyle = index <= stage ? tone : C.border;
    ctx.lineWidth = index === stage ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, 84, index === stage ? 12 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, `${index + 1} ${name}`, x, 111, index === stage ? C.control : index < stage ? tone : C.muted, 10.5, 'center');
  });
}

function drawMovingPackets(ctx: CanvasRenderingContext2D, route: Route, stage: number, phase: number) {
  const paths = {
    inputText: [{ x: 18, y: 202 }, { x: 42, y: 202 }],
    inputImage: [{ x: 18, y: 268 }, { x: 42, y: 268 }],
    inputNoise: [{ x: 18, y: 338 }, { x: 42, y: 338 }],
    textEncode: [{ x: 148, y: 202 }, { x: 212, y: 202 }],
    imageEncode: [{ x: 148, y: 268 }, { x: 212, y: 286 }],
    noiseEncode: [{ x: 148, y: 338 }, { x: 212, y: 312 }],
    textMerge: [{ x: 332, y: 202 }, { x: 410, y: 215 }],
    imageMerge: [{ x: 332, y: 286 }, { x: 410, y: 248 }],
    noiseMerge: [{ x: 332, y: 312 }, { x: 410, y: 314 }],
    trunk: [{ x: 496, y: 263 }, { x: 548, y: 263 }, { x: 584, y: 200 }, { x: 681, y: 200 }, { x: 681, y: 330 }, { x: 778, y: 330 }],
    understandHead: [{ x: 788, y: 244 }, { x: 858, y: 217 }],
    generateHead: [{ x: 788, y: 266 }, { x: 858, y: 317 }],
    understandClose: [{ x: 858, y: 217 }, { x: 820, y: 217 }, { x: 820, y: 448 }, { x: 183, y: 484 }],
    generateClose: [{ x: 1026, y: 317 }, { x: 1040, y: 317 }, { x: 1040, y: 448 }, { x: 872, y: 484 }],
    understandLoss: [{ x: 858, y: 217 }, { x: 820, y: 217 }, { x: 820, y: 448 }, { x: 468, y: 484 }],
    generateLoss: [{ x: 1026, y: 317 }, { x: 1040, y: 317 }, { x: 1040, y: 448 }, { x: 608, y: 484 }],
    gradient: [{ x: 518, y: 484 }, { x: 518, y: 452 }, { x: 681, y: 430 }, { x: 681, y: 330 }],
  } satisfies Record<string, Point[]>;
  const includesUnderstanding = route !== 'generation';
  const includesGeneration = route !== 'understanding';

  if (stage === 0) {
    flowPacket(ctx, paths.inputText, phase, 'text');
    if (includesUnderstanding) flowPacket(ctx, paths.inputImage, phase, 'image');
    if (includesGeneration) flowPacket(ctx, paths.inputNoise, phase, 'noise');
  }
  if (stage === 1) {
    flowPacket(ctx, paths.textEncode, phase, 'text');
    if (includesUnderstanding) flowPacket(ctx, paths.imageEncode, phase, 'image');
    if (includesGeneration) flowPacket(ctx, paths.noiseEncode, phase, 'noise');
  }
  if (stage === 2) {
    flowPacket(ctx, paths.textMerge, phase, 'text');
    if (includesUnderstanding) flowPacket(ctx, paths.imageMerge, phase, 'image');
    if (includesGeneration) flowPacket(ctx, paths.noiseMerge, phase, 'noise');
  }
  if (stage === 3) flowPacket(ctx, paths.trunk, phase, 'state');
  if (stage === 4) {
    if (includesUnderstanding) flowPacket(ctx, paths.understandHead, phase, 'state');
    if (includesGeneration) flowPacket(ctx, paths.generateHead, phase, 'state');
  }
  if (stage === 5 && route === 'understanding') flowPacket(ctx, paths.understandClose, phase, 'text');
  if (stage === 5 && route === 'generation') flowPacket(ctx, paths.generateClose, phase, 'image');
  if (stage === 5 && route === 'joint') {
    flowPacket(ctx, paths.understandLoss, phase, 'text');
    flowPacket(ctx, paths.generateLoss, phase, 'image');
    if (phase > 0.55) flowPacket(ctx, paths.gradient, (phase - 0.55) / 0.45, 'loss');
  }
}

function drawOverview(ctx: CanvasRenderingContext2D, route: Route, stage: number, phase: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.desk;
  ctx.fillRect(0, 632, W, 68);

  label(ctx, 'SenseNova-U1 整体架构', 30, 30, C.text, 19);
  label(ctx, `当前路径：${routeName[route]}`, 30, 56, routeTone[route], 12.5);
  label(ctx, `当前载荷：${routePayload[route][stage]}`, 232, 56, C.control, 12.5);
  legendItem(ctx, 720, 27, 'text', '文本');
  legendItem(ctx, 812, 27, 'image', '图像');
  legendItem(ctx, 904, 27, 'noise', '噪声');
  legendItem(ctx, 996, 27, 'loss', '梯度', true);
  drawStageRail(ctx, stage, routeTone[route]);

  const columns = [
    { x: 24, w: 142, title: '① 原生输入' },
    { x: 194, w: 156, title: '② 轻量接口' },
    { x: 378, w: 150, title: '③ 统一序列' },
    { x: 556, w: 250, title: '④ NEO-unify MoT' },
    { x: 834, w: 216, title: '⑤ 双输出头' },
  ];
  columns.forEach((column, index) => {
    rounded(ctx, column.x, 126, column.w, 304, C.border, stage === index);
    label(ctx, column.title, column.x + column.w / 2, 154, stage === index ? C.control : C.text, 13, 'center');
  });

  const usesUnderstanding = route !== 'generation';
  const usesGeneration = route !== 'understanding';
  const imageOptional = route === 'generation';

  rounded(ctx, 42, 178, 106, 48, C.current, stage === 0);
  label(ctx, '文本 token', 95, 198, C.current, 12, 'center');
  label(ctx, '原分词器', 95, 216, C.muted, 10, 'center');
  rounded(ctx, 42, 241, 106, 54, usesUnderstanding ? C.success : C.border, stage === 0 && usesUnderstanding);
  label(ctx, imageOptional ? '条件图像' : '干净像素', 95, 263, imageOptional ? C.muted : C.success, 11.5, 'center');
  label(ctx, imageOptional ? 'X2I 可选' : 'H×W×3', 95, 282, C.muted, 10, 'center');
  rounded(ctx, 42, 312, 106, 54, usesGeneration ? C.aux : C.border, stage === 0 && usesGeneration);
  label(ctx, '噪声状态', 95, 334, usesGeneration ? C.aux : C.muted, 11.5, 'center');
  label(ctx, '当前待去噪状态', 95, 353, C.muted, 10, 'center');
  label(ctx, '无预训练 VE · 无 VAE', 95, 409, C.failure, 10, 'center');

  rounded(ctx, 212, 178, 120, 58, C.current, stage === 1);
  label(ctx, '词嵌入', 272, 201, C.current, 12, 'center');
  label(ctx, '沿用 LLM 词表', 272, 222, C.muted, 10, 'center');
  rounded(ctx, 212, 257, 120, 84, C.success, stage === 1);
  label(ctx, '2× Conv + GELU', 272, 282, C.success, 11.5, 'center');
  label(ctx, '步幅 16 × 2', 272, 303, C.text, 10.5, 'center');
  label(ctx, '32×32 → 1 token', 272, 324, C.muted, 10, 'center');
  label(ctx, '图像与噪声共用接口', 272, 400, C.muted, 10, 'center');

  label(ctx, 'Native RoPE · T/H/W', 453, 181, C.current, 10.5, 'center');
  const tokenRows = [
    { y: 198, tone: C.current, text: '文' },
    { y: 231, tone: C.success, text: '图' },
    { y: 264, tone: C.current, text: '文' },
    { y: 297, tone: C.aux, text: '噪' },
  ];
  tokenRows.forEach((item, index) => {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = item.tone;
    ctx.lineWidth = stage === 2 ? 3 : 2;
    ctx.fillRect(410, item.y, 86, 23);
    ctx.strokeRect(410, item.y, 86, 23);
    label(ctx, `${item.text}${index + 1}`, 453, item.y + 16, item.tone, 10.5, 'center');
  });
  label(ctx, '混合注意力掩码', 453, 365, C.text, 11, 'center');
  label(ctx, '干净 → 噪声可读', 453, 386, C.success, 10, 'center');
  label(ctx, '噪声 → 干净阻断', 453, 405, C.failure, 10, 'center');

  label(ctx, '逐层重复：交换上下文，保留专属参数', 681, 166, C.muted, 10.5, 'center');
  [0, 1, 2].forEach((index) => {
    const y = 178 + index * 65;
    rounded(ctx, 574, y, 214, 52, C.current, stage === 3);
    rounded(ctx, 584, y + 10, 50, 31, C.current, false);
    rounded(ctx, 648, y + 10, 66, 31, C.success, false, '#f2faf6');
    rounded(ctx, 728, y + 10, 50, 31, C.aux, false);
    label(ctx, '投影', 609, y + 30, C.current, 10, 'center');
    label(ctx, '共享注意力', 681, y + 30, C.success, 9.5, 'center');
    label(ctx, 'FFN', 753, y + 30, C.aux, 10, 'center');
  });
  label(ctx, '理解流 / 生成流', 681, 392, C.text, 11, 'center');
  label(ctx, '投影 · Norm · FFN 参数解耦', 681, 412, C.muted, 10, 'center');

  rounded(ctx, 858, 184, 168, 66, C.current, stage === 4 && usesUnderstanding);
  label(ctx, '理解线性头', 942, 210, C.current, 12.5, 'center');
  label(ctx, '隐藏状态 → 词表', 942, 232, C.text, 10.5, 'center');
  rounded(ctx, 858, 284, 168, 66, C.success, stage === 4 && usesGeneration);
  label(ctx, '生成 MLP 头', 942, 310, C.success, 12.5, 'center');
  label(ctx, '隐藏状态 → 像素 patch', 942, 332, C.text, 10.5, 'center');
  label(ctx, '同一主干 · 不对称解码', 942, 405, C.muted, 10, 'center');

  const segmentTone = (tone: string, requiredStage: number, enabled: boolean) => enabled && stage >= requiredStage ? tone : C.border;
  pathArrow(ctx, [{ x: 148, y: 202 }, { x: 212, y: 202 }], segmentTone(C.current, 1, true), stage === 1);
  pathArrow(ctx, [{ x: 148, y: 268 }, { x: 212, y: 286 }], segmentTone(C.success, 1, usesUnderstanding), stage === 1 && usesUnderstanding, imageOptional);
  pathArrow(ctx, [{ x: 148, y: 338 }, { x: 212, y: 312 }], segmentTone(C.aux, 1, usesGeneration), stage === 1 && usesGeneration, true);
  pathArrow(ctx, [{ x: 332, y: 202 }, { x: 410, y: 215 }], segmentTone(C.current, 2, true), stage === 2);
  pathArrow(ctx, [{ x: 332, y: 286 }, { x: 410, y: 248 }], segmentTone(C.success, 2, usesUnderstanding), stage === 2 && usesUnderstanding, imageOptional);
  pathArrow(ctx, [{ x: 332, y: 312 }, { x: 410, y: 314 }], segmentTone(C.aux, 2, usesGeneration), stage === 2 && usesGeneration, true);
  pathArrow(ctx, [{ x: 496, y: 263 }, { x: 548, y: 263 }, { x: 574, y: 263 }], segmentTone(C.control, 3, true), stage === 3);
  pathArrow(ctx, [{ x: 788, y: 244 }, { x: 858, y: 217 }], segmentTone(C.current, 4, usesUnderstanding), stage === 4 && usesUnderstanding);
  pathArrow(ctx, [{ x: 788, y: 266 }, { x: 858, y: 317 }], segmentTone(C.aux, 4, usesGeneration), stage === 4 && usesGeneration, true);

  rounded(ctx, 24, 458, 1026, 148, C.border, stage === 5, C.white);

  // Draw the task paths before the cards so no route line can cover card text.
  // Animated packets stop above y=500 as they arrive at each card's top edge.
  if (stage >= 5) {
    if (route === 'understanding') pathArrow(ctx, [{ x: 858, y: 217 }, { x: 820, y: 217 }, { x: 820, y: 448 }, { x: 183, y: 490 }], C.current, true);
    if (route === 'generation') pathArrow(ctx, [{ x: 1026, y: 317 }, { x: 1040, y: 317 }, { x: 1040, y: 448 }, { x: 872, y: 490 }], C.aux, true, true);
    if (route === 'joint') {
      pathArrow(ctx, [{ x: 858, y: 217 }, { x: 820, y: 217 }, { x: 820, y: 448 }, { x: 468, y: 490 }], C.current, true);
      pathArrow(ctx, [{ x: 1026, y: 317 }, { x: 1040, y: 317 }, { x: 1040, y: 448 }, { x: 608, y: 490 }], C.success, true);
      pathArrow(ctx, [{ x: 518, y: 490 }, { x: 518, y: 452 }, { x: 681, y: 430 }, { x: 681, y: 370 }], C.failure, true, true);
    }
  }

  if (stage === 5) drawMovingPackets(ctx, route, stage, phase);
  ctx.fillStyle = C.white;
  ctx.fillRect(38, 466, 300, 24);
  label(ctx, `⑥ 任务闭环 · ${routePayload[route][stage]}`, 44, 484, stage === 5 ? C.control : C.text, 13);
  rounded(ctx, 44, 500, 278, 76, C.current, stage === 5 && route === 'understanding');
  label(ctx, '理解路径', 183, 523, C.current, 12.5, 'center');
  label(ctx, '语言 CE → 自回归词输出', 183, 546, C.text, 10.5, 'center');
  label(ctx, 'LightLLM', 183, 565, C.muted, 10, 'center');
  rounded(ctx, 344, 500, 348, 76, C.success, stage === 5 && route === 'joint');
  label(ctx, '联合训练', 518, 523, C.success, 12.5, 'center');
  label(ctx, '联合目标：语言 CE + 像素 MSE', 518, 546, C.text, 10.5, 'center');
  label(ctx, '语言 CE + 像素流匹配 MSE', 518, 565, C.muted, 10, 'center');
  rounded(ctx, 714, 500, 316, 76, C.aux, stage === 5 && route === 'generation');
  label(ctx, '生成路径', 872, 523, C.aux, 12.5, 'center');
  label(ctx, '流匹配迭代 + 双 CFG + DMD2', 872, 546, C.text, 10.5, 'center');
  label(ctx, 'LightX2V → 像素图像', 872, 565, C.muted, 10, 'center');
  label(ctx, '统一接口与上下文；保留任务专属输出头、损失与运行节奏', W / 2, 598, C.muted, 10.5, 'center');

  if (stage !== 5) drawMovingPackets(ctx, route, stage, phase);
  label(ctx, `阶段 ${stage + 1}/6 · ${routeStageCopy[route][stage]}`, 24, 668, C.text, 11.5);
}

export const SystemOverview: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [route, setRoute] = useState<Route>('joint');
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStage((value) => (value + 1) % STAGE_COUNT), 2400);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    let startedAt = 0;
    const frame = (now: number) => {
      if (!startedAt) startedAt = now;
      const phase = reduced ? 0.72 : Math.min(1, (now - startedAt) / 1900);
      drawOverview(ctx, route, stage, phase);
      canvas.classList.add('is-ready');
      if (!reduced && phase < 1) raf = requestAnimationFrame(frame);
      else raf = null;
    };
    const start = () => { if (raf === null) { startedAt = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [route, stage]);

  const chooseRoute = (next: Route) => {
    setRoute(next);
    setStage(0);
    setPlaying(true);
  };

  const chooseStage = (next: number) => {
    setStage(next);
    setPlaying(false);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`SenseNova-U1 端到端整体架构；${routeName[route]}；阶段 ${stage + 1}：${stageNames[stage]}；当前载荷为${routePayload[route][stage]}`}
      />
      <div className="ctrl" role="radiogroup" aria-label="选择整体架构中的数据流">
        <button type="button" role="radio" aria-checked={route === 'understanding'} onClick={() => chooseRoute('understanding')}>理解：图文输入 → 文本 token</button>
        <button type="button" role="radio" aria-checked={route === 'generation'} onClick={() => chooseRoute('generation')}>生成：条件与噪声 → 像素</button>
        <button type="button" role="radio" aria-checked={route === 'joint'} onClick={() => chooseRoute('joint')}>联合训练：文本损失 + 生成损失</button>
      </div>
      <div className="ctrl" role="group" aria-label="选择数据流阶段">
        {stageNames.map((name, index) => (
          <button key={name} type="button" aria-pressed={stage === index} onClick={() => chooseStage(index)}>{index + 1} · {name}</button>
        ))}
        <button type="button" onClick={() => { setStage(0); setPlaying(true); }}>从头播放</button>
        <button type="button" aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>{playing ? '暂停' : '继续播放'}</button>
      </div>
      <div className="feedback good" aria-live="polite">
        阶段 {stage + 1}/6 · 当前载荷：{routePayload[route][stage]}。{routeStageCopy[route][stage]}
      </div>
      <p className="note">图例：蓝色“文”为文本，绿色“图”为图像，紫色“噪”为噪声状态，红色“∇”为联合训练的回传梯度。证据范围：视觉接口见 §3.1（p.7），Native MoT、位置与混合掩码见 §3.2（p.8），联合目标见 §3.3（p.8–9），训练课程见 §3.4（p.9–12），推理与部署见 §3.5（p.12–13）。动画表达数据依赖，不表示真实时延比例。</p>
    </div>
  );
};

export default SystemOverview;
