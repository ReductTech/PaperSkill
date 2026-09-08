import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';


const C = {
  bg: '#f5f8f0',
  paper: '#ffffff',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  softBlue: '#eaf0f8',
  softGreen: '#eaf7f0',
  softRed: '#fcecef',
  softOrange: '#fff3df',
  softPurple: '#f1eafe',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  size = 14,
  weight = 500,
  align: CanvasTextAlign = 'left',
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function wrapLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color = C.text,
  size = 14,
  weight = 500,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  const chars = Array.from(text);
  let line = '';
  let yy = y;
  chars.forEach((ch) => {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, yy);
}

function drawSurface(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  roundRect(ctx, 10, 10, w - 20, h - 20, 14);
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  subtitle: string,
  accent: string,
  fill: string,
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  label(ctx, title, x + 18, y + 27, accent, 16, 800);
  label(ctx, subtitle, x + 18, y + 48, C.muted, 12, 600);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - Math.PI / 6), y2 - s * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - s * Math.cos(a + Math.PI / 6), y2 - s * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function tokenCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  text: string,
  revealed: boolean,
  accent = C.blue,
  glow = false,
) {
  if (glow) {
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 13;
  }
  ctx.fillStyle = revealed ? C.paper : C.softBlue;
  roundRect(ctx, x, y, w, 42, 9);
  ctx.fill();
  ctx.strokeStyle = revealed ? C.green : accent;
  ctx.lineWidth = glow ? 3 : revealed ? 2 : 1.2;
  ctx.stroke();
  ctx.restore();
  label(ctx, revealed ? text : '[MASK]', x + w / 2, y + 27, revealed ? C.text : accent, 12, 700, 'center');
}

function drawOverview(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  label(ctx, 'iLLaDA：围绕预训练规模、指令微调和推理生成进行系统改进', 28, 38, C.text, 16, 800);

  const stages = [
    { title: '12T Pre-train', sub: 'Masked Diffusion', color: C.green, fill: C.softGreen },
    { title: 'iLLaDA Base', sub: '8B · Bidirectional', color: C.blue, fill: C.softBlue },
    { title: 'Unified SFT', sub: '25B × 12 epochs', color: C.purple, fill: C.softPurple },
    { title: 'Instruct', sub: 'Prompt/Resp/EOS', color: C.blue, fill: C.softBlue },
    { title: 'Variable-Length', sub: 'Block + EOS', color: C.orange, fill: C.softOrange },
    { title: 'Evaluation', sub: 'Base + Instruct', color: C.green, fill: C.softGreen },
  ];
  const startX = 28;
  const gap = 16;
  const boxW = (w - startX * 2 - gap * 5) / 6;
  const y = 80;
  const active = Math.floor((t / 1150) % stages.length);

  stages.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    ctx.save();
    if (i === active) {
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = s.fill;
    roundRect(ctx, x, y, boxW, 78, 12);
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = i === active ? 3 : 1.2;
    ctx.stroke();
    ctx.restore();
    label(ctx, s.title, x + boxW / 2, y + 31, s.color, 13, 800, 'center');
    label(ctx, s.sub, x + boxW / 2, y + 54, C.muted, 11, 600, 'center');
    if (i < stages.length - 1) {
      arrow(ctx, x + boxW + 3, y + 39, x + boxW + gap - 3, y + 39, C.muted);
    }
  });

  const pills = [
    ['Scale Up', '训练得更充分', C.green, C.softGreen],
    ['Unified SFT', 'SFT 更一致', C.purple, C.softPurple],
    ['Variable-Length', '生成方式更实用', C.orange, C.softOrange],
  ] as const;
  pills.forEach((p, i) => {
    const pw = 214;
    const x = w / 2 - (pw * 3 + 16 * 2) / 2 + i * (pw + 16);
    ctx.fillStyle = p[3];
    roundRect(ctx, x, 190, pw, 48, 10);
    ctx.fill();
    label(ctx, p[0], x + 14, 211, p[2], 13, 800);
    label(ctx, p[1], x + 14, 230, C.text, 12, 600);
  });

  label(ctx, '三个核心方向：训练得更充分 · SFT 更一致 · 生成方式更实用', w / 2, h - 22, C.blue, 14, 800, 'center');
}

function drawGPTvsDiffusion(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  const margin = 22;
  const gap = 18;
  const panelW = (w - margin * 2 - gap) / 2;
  const panelH = h - 50;
  const leftPanelX = margin;
  const rightPanelX = margin + panelW + gap;
  panel(ctx, leftPanelX, 22, panelW, panelH, 'GPT / Autoregressive', 'Left-to-Right · Fixed Generation Order', C.red, '#fff7f8');
  panel(ctx, rightPanelX, 22, panelW, panelH, 'LLaDA / Masked Diffusion', 'Bidirectional Context · Dynamic Token Reveal', C.green, '#f5fbf7');

  const cycle = 6000;
  const phase = Math.min(4, Math.floor((t % cycle) / 1200));
  const arTokens = ['The', 'model', 'generates', 'text'];
  const diffTokens = ['The', 'model', 'generates', 'text'];
  const tokenW = 82;
  const cellGap = 10;
  const stripW = tokenW * 4 + cellGap * 3;
  const leftX = leftPanelX + (panelW - stripW) / 2;
  const rightX = rightPanelX + (panelW - stripW) / 2;
  const y = 120;

  function arSlot(x: number, word: string, index: number, visible: boolean, active: boolean) {
    ctx.save();
    if (active) {
      ctx.shadowColor = C.red;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = visible ? C.paper : 'rgba(255,255,255,0.45)';
    roundRect(ctx, x, y, tokenW, 42, 9);
    ctx.fill();
    ctx.strokeStyle = visible ? C.red : 'rgba(196,63,82,0.24)';
    ctx.setLineDash(visible ? [] : [5, 5]);
    ctx.lineWidth = active ? 3 : visible ? 1.8 : 1.1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    label(ctx, visible ? word : String(index + 1), x + tokenW / 2, y + 27, visible ? C.text : 'rgba(196,63,82,0.35)', visible ? 12 : 11, 800, 'center');
  }

  const arCount = Math.max(1, phase);
  arTokens.forEach((word, i) => {
    arSlot(leftX + i * (tokenW + cellGap), word, i, i < arCount, i === arCount - 1 && phase < 4);
    if (i < arTokens.length - 1) {
      label(ctx, '|', leftX + i * (tokenW + cellGap) + tokenW + cellGap / 2, y + 27, C.red, 14, 800, 'center');
    }
  });
  label(ctx, '1 → 2 → 3 → 4', leftPanelX + panelW / 2, 195, C.red, 17, 900, 'center');
  label(ctx, 'Position determines generation order', leftPanelX + panelW / 2, 226, C.text, 14, 900, 'center');
  label(ctx, '生成位置决定生成顺序', leftPanelX + panelW / 2, 252, C.muted, 12, 700, 'center');

  const order = [2, 1, 3, 0];
  const scoreFrames = [
    [0.88, 0.74, 0.96, 0.82],
    [0.91, 0.95, NaN, 0.87],
    [0.92, NaN, NaN, 0.90],
    [0.97, NaN, NaN, NaN],
    [NaN, NaN, NaN, NaN],
  ];
  const diffStep = phase;
  const revealed = order.slice(0, diffStep);
  const next = diffStep < 4 ? order[diffStep] : -1;
  const scores = scoreFrames[diffStep];
  diffTokens.forEach((word, i) => {
    const x = rightX + i * (tokenW + cellGap);
    const isRevealed = revealed.includes(i);
    const isNext = i === next;
    tokenCell(ctx, x, y, tokenW, word, isRevealed, C.blue, isNext);
    if (!isRevealed) {
      const score = scores[i];
      label(ctx, Number.isNaN(score) ? '—' : score.toFixed(2), x + tokenW / 2, y - 12, isNext ? C.green : C.muted, 11, isNext ? 900 : 700, 'center');
    }
  });
  if (next >= 0) {
    const tx = rightX + next * (tokenW + cellGap) + tokenW / 2;
    arrow(ctx, tx, y - 34, tx, y - 4, C.green);
  }
  label(ctx, '3 → 2 → 4 → 1', rightPanelX + panelW / 2, 195, C.green, 17, 900, 'center');
  label(ctx, 'Context + Confidence determine reveal order', rightPanelX + panelW / 2, 226, C.text, 14, 900, 'center');
  label(ctx, '双向上下文与置信度共同决定恢复顺序', rightPanelX + panelW / 2, 252, C.muted, 12, 700, 'center');
  label(ctx, '示意顺序，用于说明动态恢复机制', rightPanelX + panelW / 2, 278, C.muted, 10, 600, 'center');
}

function drawScale(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  const step = Math.min(4, Math.floor((t % 6500) / 1300));
  label(ctx, 'Research Question', 34, 38, C.orange, 12, 900);
  label(ctx, 'Diffusion limitation?', 164, 38, step === 0 ? C.red : C.muted, 15, 900);
  label(ctx, 'or', 338, 38, C.muted, 13, 700);
  label(ctx, 'Insufficient scaling?', 374, 38, step === 0 ? C.green : C.text, 15, 900);

  const pulse = 0.5 + 0.5 * Math.sin(t / 520);
  ctx.save();
  ctx.shadowColor = C.green;
  ctx.shadowBlur = step >= 1 ? 14 + pulse * 8 : 0;
  ctx.fillStyle = C.softGreen;
  roundRect(ctx, 54, 66, w - 108, 104, 18);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = step >= 1 ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  label(ctx, 'Pre-training Tokens', w / 2, 95, C.green, 14, 900, 'center');
  label(ctx, '2.3T', w / 2 - 132, 138, C.muted, 40, 900, 'center');
  arrow(ctx, w / 2 - 66, 125, w / 2 + 58, 125, C.green);
  label(ctx, step >= 1 ? '12T' : '...', w / 2 + 132, 138, C.green, 48, 900, 'center');
  label(ctx, '≈ 5.2× Pre-training Scale', w / 2, 160, C.green, 14, 900, 'center');

  const aux = [
    ['Longer Context', '4K → 8K', C.blue, C.softBlue],
    ['GQA', 'MHA → GQA', C.purple, C.softPurple],
    ['Random-Length', 'Training', C.orange, C.softOrange],
  ] as const;
  aux.forEach((a, i) => {
    const x = 84 + i * 220;
    ctx.globalAlpha = step >= 2 ? 1 : 0.25;
    ctx.fillStyle = a[3];
    roundRect(ctx, x, 188, 176, 46, 10);
    ctx.fill();
    ctx.strokeStyle = a[2];
    ctx.lineWidth = 1.2;
    ctx.stroke();
    label(ctx, a[0], x + 14, 207, a[2], 12, 900);
    label(ctx, a[1], x + 14, 225, C.text, 12, 700);
    ctx.globalAlpha = 1;
  });
  label(ctx, 'Scale Up 配套完善训练配置', w / 2, 253, C.muted, 12, 700, 'center');

  const resultY = 276;
  ctx.globalAlpha = step >= 3 ? 1 : 0.18;
  const resultCards = [
    ['LLaDA-Base', '51.1', C.red, C.softRed],
    ['iLLaDA-Base', '63.9', C.green, C.softGreen],
    ['Qwen2.5-7B Base', '63.3', C.blue, C.softBlue],
  ] as const;
  resultCards.forEach((r, i) => {
    const x = 70 + i * 240;
    ctx.fillStyle = r[3];
    roundRect(ctx, x, resultY, 180, 64, 12);
    ctx.fill();
    ctx.strokeStyle = r[2];
    ctx.lineWidth = i === 1 ? 3 : 1.4;
    ctx.stroke();
    label(ctx, r[0], x + 90, resultY + 23, r[2], 12, 900, 'center');
    label(ctx, r[1], x + 90, resultY + 52, r[2], i === 1 ? 28 : 24, 900, 'center');
    if (i === 0) arrow(ctx, x + 186, resultY + 35, x + 232, resultY + 35, C.green);
    if (i === 1) label(ctx, '≈', x + 214, resultY + 43, C.green, 28, 900, 'center');
  });
  ctx.globalAlpha = 1;

  if (step >= 4) {
    ctx.fillStyle = C.softBlue;
    roundRect(ctx, 72, h - 42, w - 144, 30, 9);
    ctx.fill();
    label(ctx, 'Scaling narrows the capability gap.', w / 2, h - 22, C.blue, 13, 900, 'center');
  }
}

type SegToken = { text: string; seg: 'prompt' | 'response' | 'eos' };

function drawSFTStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  tokens: SegToken[],
  masked: Set<number>,
  accent: string,
) {
  const gap = 5;
  const cellW = (width - gap * (tokens.length - 1)) / tokens.length;
  tokens.forEach((tok, i) => {
    const isMask = masked.has(i);
    const segColor = tok.seg === 'prompt' ? C.blue : tok.seg === 'response' ? C.green : C.orange;
    ctx.fillStyle = isMask ? C.softBlue : '#fff';
    roundRect(ctx, x + i * (cellW + gap), y, cellW, 40, 7);
    ctx.fill();
    ctx.strokeStyle = isMask ? accent : segColor;
    ctx.lineWidth = isMask ? 2 : 1.2;
    ctx.stroke();
    label(ctx, isMask ? 'MASK' : tok.text, x + i * (cellW + gap) + cellW / 2, y + 25, isMask ? accent : C.text, 10, 700, 'center');
  });
}

function drawSFT(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  label(ctx, 'Pre-training', 28, 36, C.purple, 13, 800);
  label(ctx, '整条序列任意位置都可能被随机 Mask', 126, 36, C.text, 13, 700);
  arrow(ctx, 408, 31, 470, 31, C.purple);
  label(ctx, 'iLLaDA：重新统一 Pre-training 与 SFT', 486, 36, C.purple, 13, 800);

  const margin = 22;
  const gap = 18;
  const pw = (w - margin * 2 - gap) / 2;
  const panelH = 208;
  panel(ctx, margin, 58, pw, panelH, 'Original LLaDA SFT', 'Prompt 固定可见，只在 response region 做 Mask', C.red, '#fff7f8');
  panel(ctx, margin + pw + gap, 58, pw, panelH, 'iLLaDA SFT', 'Prompt / Response / terminal EOS 都进入随机 Mask', C.green, '#f5fbf7');

  const toks: SegToken[] = [
    { text: 'User', seg: 'prompt' },
    { text: 'Explain', seg: 'prompt' },
    { text: 'It', seg: 'response' },
    { text: 'denoises', seg: 'response' },
    { text: 'tokens', seg: 'response' },
    { text: 'EOS', seg: 'eos' },
  ];
  const phase = Math.floor((t / 1050) % 4);
  const leftPatterns = [new Set([2, 4]), new Set([3]), new Set([2, 3]), new Set([4])];
  const rightPatterns = [new Set([0, 3, 5]), new Set([1, 4]), new Set([0, 2, 4]), new Set([1, 3, 5])];
  const stripY = 130;
  drawSFTStrip(ctx, margin + 18, stripY, pw - 36, toks, leftPatterns[phase], C.red);
  drawSFTStrip(ctx, margin + pw + gap + 18, stripY, pw - 36, toks, rightPatterns[phase], C.green);

  label(ctx, 'Prompt', margin + 76, 202, C.blue, 11, 800, 'center');
  label(ctx, 'Response / EOS region', margin + 278, 202, C.green, 11, 800, 'center');
  label(ctx, 'Mask 范围改变', margin + pw / 2, 235, C.red, 14, 800, 'center');

  label(ctx, 'Prompt', margin + pw + gap + 76, 202, C.blue, 11, 800, 'center');
  label(ctx, 'Response', margin + pw + gap + 260, 202, C.green, 11, 800, 'center');
  label(ctx, 'EOS', margin + pw + gap + 370, 202, C.orange, 11, 800, 'center');
  label(ctx, '继续使用整序列随机 Mask', margin + pw + gap + pw / 2, 235, C.green, 14, 800, 'center');

  ctx.fillStyle = C.softBlue;
  roundRect(ctx, 28, 280, w - 56, 34, 8);
  ctx.fill();
  label(ctx, 'SFT 继续学习与预训练相同的整序列去噪任务；EOS 也被纳入学习。', w / 2, 302, C.blue, 11, 800, 'center');
}

function blockCells(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  values: string[],
  revealed: number,
  eosIndex = -1,
  active = true,
) {
  const cellW = 64;
  const gap = 7;
  values.forEach((v, i) => {
    const isRevealed = i < revealed;
    const isEOS = isRevealed && i === eosIndex;
    ctx.globalAlpha = active ? 1 : 0.42;
    ctx.fillStyle = isRevealed ? (isEOS ? C.softOrange : C.softGreen) : C.softBlue;
    roundRect(ctx, x + i * (cellW + gap), y, cellW, 42, 8);
    ctx.fill();
    ctx.strokeStyle = isEOS ? C.orange : isRevealed ? C.green : C.blue;
    ctx.lineWidth = isEOS ? 3 : 1.5;
    ctx.stroke();
    label(ctx, isRevealed ? v : 'MASK', x + i * (cellW + gap) + cellW / 2, y + 26, isEOS ? C.orange : isRevealed ? C.text : C.blue, 10, 800, 'center');
    ctx.globalAlpha = 1;
  });
}

function drawVariableLength(ctx: CanvasRenderingContext2D, step: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  label(ctx, '问题：开放式回答长度未知，但 Diffusion 需要先准备 Mask', 28, 37, C.text, 16, 800);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#f2f4f8';
  roundRect(ctx, 28, 57, w - 56, 42, 10);
  ctx.fill();
  label(ctx, 'Fixed-length（示意）', 42, 83, C.muted, 12, 800);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i < 4 ? '#dbe3ee' : '#eef1f5';
    roundRect(ctx, 174 + i * 34, 69, 26, 18, 4);
    ctx.fill();
  }
  label(ctx, '若回答很短，后面大量预留 Mask 会变成无效预算', w - 38, 83, C.muted, 11, 600, 'right');
  ctx.globalAlpha = 1;

  label(ctx, 'Variable-Length', 28, 129, C.orange, 13, 800);
  ctx.fillStyle = C.softBlue;
  roundRect(ctx, 28, 145, 116, 48, 10);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.stroke();
  label(ctx, 'Prompt', 86, 175, C.blue, 14, 800, 'center');
  arrow(ctx, 150, 169, 182, 169, C.blue);

  const block1 = ['Diffusion', 'can', 'scale', '.'];
  const block2 = ['It', 'is', 'strong', 'EOS'];
  const b1x = 192;
  const b2x = 505;
  const by = 148;

  const b1Reveal = step === 0 ? 0 : step === 1 ? 2 : 4;
  blockCells(ctx, b1x, by, block1, b1Reveal, -1, true);
  label(ctx, 'Mask Block 1', b1x + 135, 218, C.blue, 12, 800, 'center');

  if (step >= 2) {
    ctx.fillStyle = C.softOrange;
    roundRect(ctx, 370, 224, 120, 30, 8);
    ctx.fill();
    label(ctx, 'No EOS → append', 430, 244, C.orange, 11, 800, 'center');
    arrow(ctx, 480, 169, 497, 169, C.orange);
  }

  if (step >= 2) {
    const b2Reveal = step === 2 ? 0 : step === 3 ? 2 : 4;
    blockCells(ctx, b2x, by, block2, b2Reveal, 3, true);
    label(ctx, 'Mask Block 2', b2x + 135, 218, C.blue, 12, 800, 'center');
  } else {
    blockCells(ctx, b2x, by, block2, 0, 3, false);
    label(ctx, '按需追加', b2x + 135, 218, C.muted, 12, 700, 'center');
  }

  const steps = [
    '① 只先追加一个 Mask Block',
    '② Block 内逐步去噪，高置信 Token 先确定',
    '③ Block 1 完成：没有 EOS，所以追加下一 Block',
    '④ 继续解码 Block 2',
    '⑤ 出现 EOS：立即停止，不再扩展长度',
  ];
  ctx.fillStyle = step === 4 ? C.softGreen : C.softBlue;
  roundRect(ctx, 28, 266, w - 56, 36, 9);
  ctx.fill();
  label(ctx, steps[clamp(step, 0, 4)], w / 2, 289, step === 4 ? C.green : C.blue, 13, 800, 'center');
  if (step === 4) {
    ctx.fillStyle = C.green;
    roundRect(ctx, w - 115, 110, 78, 30, 9);
    ctx.fill();
    label(ctx, 'STOP', w - 76, 131, '#fff', 12, 900, 'center');
  }

}

function drawVerticalBars(
  ctx: CanvasRenderingContext2D,
  data: { name: string; value: number; color: string }[],
  max: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  [0, 20, 40, 60, 80].forEach((v) => {
    const yy = y + h - (v / max) * h;
    ctx.strokeStyle = 'rgba(215,222,234,0.6)';
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
    label(ctx, String(v), x - 8, yy + 4, C.muted, 10, 600, 'right');
  });

  const slot = w / data.length;
  const barW = Math.min(62, slot * 0.55);
  data.forEach((d, i) => {
    const bh = (d.value / max) * h;
    const bx = x + slot * i + (slot - barW) / 2;
    const by = y + h - bh;
    ctx.fillStyle = d.color;
    roundRect(ctx, bx, by, barW, bh, 7);
    ctx.fill();
    label(ctx, d.value.toFixed(1), bx + barW / 2, by - 9, d.color, 13, 900, 'center');
    label(ctx, d.name, bx + barW / 2, y + h + 20, C.text, 11, 700, 'center');
  });
}

function drawExperiment(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  drawSurface(ctx, w, h);
  const phase = Math.floor((t % 5200) / 1300);
  label(ctx, '三项改进对应的关键结果', 32, 40, C.text, 16, 900);
  label(ctx, '改进项 → 关键证据 → 结论', w - 34, 40, C.muted, 12, 800, 'right');

  const cards = [
    {
      no: '01',
      title: '规模化预训练',
      tag: '能力提升 ↑',
      color: C.green,
      fill: C.softGreen,
      headline: '51.1 → 63.9 ≈ 63.3',
      note: '基础能力差距显著缩小',
      small: '平均分：LLaDA-Base / iLLaDA-Base / Qwen2.5-7B Base',
    },
    {
      no: '02',
      title: '统一 SFT',
      tag: '能力提升 ↑',
      color: C.purple,
      fill: C.softPurple,
      headline: '54.5 → 67.1',
      note: '指令微调收益明显',
      small: '增益 +12.6；参考：Qwen2.5-7B-Instruct 77.1',
    },
    {
      no: '03',
      title: '可变长度生成',
      tag: '生成机制 ✓',
      color: C.orange,
      fill: C.softOrange,
      headline: 'Fixed Length → Block + EOS',
      note: '支持动态停止',
      small: '论文未报告专门的延迟 / 计算量消融',
    },
  ] as const;

  const margin = 28;
  const gap = 16;
  const cardW = (w - margin * 2 - gap * 2) / 3;
  const cardY = 72;
  const cardH = 218;

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap);
    const active = phase === i || phase === 3;
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.48;
    if (active) {
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = card.fill;
    roundRect(ctx, x, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = card.color;
    ctx.lineWidth = active ? 2.5 : 1.2;
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = active ? 1 : 0.65;
    label(ctx, card.no, x + 18, cardY + 29, card.color, 13, 900);
    label(ctx, card.title, x + 54, cardY + 30, C.text, 17, 900);

    ctx.fillStyle = '#fff';
    roundRect(ctx, x + 18, cardY + 48, 116, 26, 13);
    ctx.fill();
    label(ctx, card.tag, x + 76, cardY + 66, card.color, 10, 900, 'center');

    if (i === 0) {
      label(ctx, 'LLaDA-Base', x + 26, cardY + 106, C.muted, 10, 800);
      label(ctx, '51.1', x + 26, cardY + 139, C.red, 23, 900);
      arrow(ctx, x + 88, cardY + 130, x + 128, cardY + 130, card.color);
      label(ctx, 'iLLaDA-Base', x + 145, cardY + 106, C.muted, 10, 800);
      label(ctx, '63.9', x + 145, cardY + 140, card.color, 32, 900);
      ctx.fillStyle = '#fff';
      roundRect(ctx, x + cardW - 104, cardY + 148, 82, 26, 13);
      ctx.fill();
      label(ctx, '≈ 63.3', x + cardW - 63, cardY + 166, C.blue, 12, 900, 'center');
    } else if (i === 1) {
      label(ctx, 'LLaDA-Instruct', x + 26, cardY + 106, C.muted, 10, 800);
      label(ctx, '54.5', x + 26, cardY + 139, C.red, 23, 900);
      arrow(ctx, x + 88, cardY + 130, x + 128, cardY + 130, card.color);
      label(ctx, 'iLLaDA-Instruct', x + 145, cardY + 106, C.muted, 10, 800);
      label(ctx, '67.1', x + 145, cardY + 140, card.color, 32, 900);
      ctx.fillStyle = '#fff';
      roundRect(ctx, x + cardW - 88, cardY + 148, 62, 26, 13);
      ctx.fill();
      label(ctx, '+12.6', x + cardW - 57, cardY + 166, card.color, 12, 900, 'center');
    } else {
      ctx.fillStyle = '#fff';
      roundRect(ctx, x + 25, cardY + 91, cardW - 50, 36, 9);
      ctx.fill();
      label(ctx, '预设完整长度', x + cardW / 2, cardY + 115, C.red, 13, 900, 'center');
      arrow(ctx, x + cardW / 2 - 34, cardY + 144, x + cardW / 2 + 34, cardY + 144, card.color);
      ctx.fillStyle = '#fff';
      roundRect(ctx, x + 25, cardY + 160, cardW - 50, 36, 9);
      ctx.fill();
      label(ctx, '按块扩展 + EOS', x + cardW / 2, cardY + 184, card.color, 13, 900, 'center');
    }

    label(ctx, card.note, x + cardW / 2, cardY + cardH - 36, card.color, 12, 900, 'center');
    wrapLabel(ctx, card.small, x + 18, cardY + cardH - 17, cardW - 36, 14, C.muted, 9, 650);
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = C.softBlue;
  roundRect(ctx, 36, h - 54, w - 72, 36, 10);
  ctx.fill();
  label(ctx, '能力提升 ↑  |  能力提升 ↑  |  生成机制完善 ✓', w / 2, h - 31, C.blue, 14, 900, 'center');
}

function drawTakeaway(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawSurface(ctx, w, h);

  const evidenceY = 48;
  const evidenceW = 310;
  const evidenceGap = 34;
  const evidenceX = w / 2 - evidenceW - evidenceGap / 2;
  const evidence = [
    {
      x: evidenceX,
      title: '能力',
      main: '63.9 ≈ 63.3',
      sub: 'iLLaDA-Base ≈ Qwen2.5-7B Base',
      color: C.green,
      fill: C.softGreen,
    },
    {
      x: evidenceX + evidenceW + evidenceGap,
      title: '生成机制',
      main: '固定长度 → Block + EOS',
      sub: '动态决定是否继续生成',
      color: C.orange,
      fill: C.softOrange,
    },
  ];
  evidence.forEach((e) => {
    ctx.fillStyle = e.fill;
    roundRect(ctx, e.x, evidenceY, evidenceW, 92, 14);
    ctx.fill();
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    label(ctx, e.title, e.x + 20, evidenceY + 27, e.color, 13, 900);
    label(ctx, e.main, e.x + evidenceW / 2, evidenceY + 58, e.color, 25, 900, 'center');
    label(ctx, e.sub, e.x + evidenceW / 2, evidenceY + 80, C.muted, 10, 700, 'center');
  });

  const stageY = 190;
  const stages = [
    { title: '可行性', q: '能不能做？', from: 'LLaDA', color: C.blue, fill: C.softBlue },
    { title: '可扩展性', q: '能不能继续 Scale？', from: 'iLLaDA', color: C.green, fill: C.softGreen },
    { title: '竞争潜力', q: '能不能接近强 AR？', from: '实验结果', color: C.orange, fill: C.softOrange },
  ];
  const stageW = 230;
  const gap = 24;
  const startX = w / 2 - (stageW * 3 + gap * 2) / 2;
  stages.forEach((s, i) => {
    const x = startX + i * (stageW + gap);
    ctx.fillStyle = s.fill;
    roundRect(ctx, x, stageY, stageW, 104, 16);
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    label(ctx, s.title, x + stageW / 2, stageY + 39, s.color, 27, 900, 'center');
    label(ctx, s.from, x + stageW / 2, stageY + 66, C.text, 13, 900, 'center');
    label(ctx, s.q, x + stageW / 2, stageY + 88, C.muted, 11, 700, 'center');
    if (i < stages.length - 1) {
      arrow(ctx, x + stageW + 5, stageY + 52, x + stageW + gap - 8, stageY + 52, C.blue);
    }
  });

  const limits = ['未证明全面超过 AR', 'Instruct 仍有差距', '无速度 / FLOPs 专门消融'];
  const pillY = stageY + 122;
  limits.forEach((text, i) => {
    const pillW = i === 2 ? 174 : 138;
    const totalW = 138 + 138 + 174 + 20 * 2;
    const x = w / 2 - totalW / 2 + i * (i === 2 ? 158 : 158);
    ctx.fillStyle = '#fff7f8';
    roundRect(ctx, x, pillY, pillW, 28, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,63,82,0.36)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    label(ctx, text, x + pillW / 2, pillY + 19, C.red, 10, 800, 'center');
  });
}

export const IlladaWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isOverview = chapterId === 'hero' && moduleId === 'overview';
  const isDual = moduleId === '2.1' || moduleId === '4.1';
  const isExperiment = moduleId === '6.1';
  const W = isOverview ? 840 : isDual || isExperiment ? 900 : 820;
  const H = isOverview
    ? 280
    : moduleId === '2.1'
      ? 310
      : moduleId === '3.1'
        ? 390
        : moduleId === '4.1'
          ? 330
          : isExperiment
            ? 350
            : moduleId === '5.1'
              ? 330
              : moduleId === '7.1'
                ? 360
                : 300;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(moduleId === '5.1');
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (moduleId !== '5.1' || !playing) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 1250);
    return () => window.clearInterval(id);
  }, [moduleId, playing]);

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
      if (isOverview) drawOverview(ctx, time, W, H);
      else if (moduleId === '2.1') drawGPTvsDiffusion(ctx, time, W, H);
      else if (moduleId === '3.1') drawScale(ctx, time, W, H);
      else if (moduleId === '4.1') drawSFT(ctx, time, W, H);
      else if (moduleId === '5.1') drawVariableLength(ctx, stepRef.current, W, H);
      else if (moduleId === '6.1') drawExperiment(ctx, time, W, H);
      else if (moduleId === '7.1') drawTakeaway(ctx, W, H);
      else drawSurface(ctx, W, H);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
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
  }, [H, W, isOverview, moduleId]);

  const showControls = moduleId === '5.1';

  return (
    <div className={isDual || isExperiment ? 'wide-widget' : undefined}>
      <canvas ref={canvasRef} width={W} height={H} aria-label={`iLLaDA interactive module ${moduleId}`} />
      {showControls ? (
        <div className="ctrl variable-controls">
          <button className={`chip ${playing ? 'active' : ''}`} onClick={() => setPlaying((p) => !p)}>
            {playing ? '暂停动画' : '自动播放'}
          </button>
          <button className="chip" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}>上一步</button>
          <button className="chip active" onClick={() => { setPlaying(false); setStep((s) => Math.min(4, s + 1)); }}>下一步 {step}/4</button>
          <button className="chip" onClick={() => { setPlaying(false); setStep(0); }}>重置</button>
          <span className="variable-takeaway">从“提前确定生成长度” → “边生成、边决定是否继续”</span>
        </div>
      ) : null}
    </div>
  );
};

export default IlladaWidget;
