import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawDesk, drawLabel } from './studio-kit';

// The paper (§3.1, p.7) compares three reference architectures: one with a pretrained
// vision encoder, one with a VAE, and its own native unified paradigm. The hero has two
// sides, so the old side stacks the first two as parallel lanes — that IS the paper's
// complaint, two pipelines with no shared representation — and the new side shows the
// third with its interior visible: two-layer conv encoding, per-layer shared
// self-attention, stream-decoupled projections/FFN, and asymmetric linear/MLP heads.
const W = 400;
const H = 310;
const CYCLE = 5200;
const DESK_Y = 286;

type Box = { x: number; w: number; label: string; sub?: string };

// Old side, lane 1 = the reference architecture with a pretrained vision encoder.
const VE_LANE: Box[] = [
  { x: 12, w: 62, label: '像素' },
  { x: 86, w: 84, label: 'VE 编码', sub: '冻结先验' },
  { x: 182, w: 84, label: 'LLM 主干' },
  { x: 278, w: 74, label: '文本' },
];
// Old side, lane 2 = the reference architecture with a VAE.
const VAE_LANE: Box[] = [
  { x: 12, w: 62, label: '文本' },
  { x: 86, w: 84, label: '扩散头', sub: '深解码' },
  { x: 182, w: 84, label: 'VAE 解码', sub: '8× 潜空间' },
  { x: 278, w: 74, label: '像素' },
];
// Each lane sits 16px below its caption (captions at y=56 and y=196) so the two blocks
// are spaced identically.
const VE_Y = 72;
const VAE_Y = 212;
const LANE_H = 44;

// New side geometry.
const IN_X = 10;
const ENC = { x: 82, y: 92, w: 70, h: 62 };
const STRIP = { x: 160, y: 68, w: 30, cell: 20, rows: 8 };
// Height leaves room for three caption lines below the block (stream names, the
// direction convention, the decoupling note) before the desk line at y=286.
const MOT = { x: 200, y: 58, w: 112, h: 174 };
const LAYERS = 4;
const HEAD_T = { x: 320, y: 78, w: 70, h: 50 };
const HEAD_P = { x: 320, y: 176, w: 70, h: 50 };

function roundBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  lineWidth = 2,
  dashed = false,
  fill: string = C.white,
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string,
  dashed = false,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 5, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 6, y - 4);
  ctx.lineTo(x2 - 6, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A frozen/pretrained marker: the paper's objection to VE is that its prior is fixed
// before the unified model ever trains.
function frostMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i += 1) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * 5, cy - Math.sin(a) * 5);
    ctx.lineTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function lanePulse(ctx: CanvasRenderingContext2D, lane: Box[], y: number, t: number, color: string) {
  const x0 = lane[0].x + lane[0].w / 2;
  const last = lane[lane.length - 1];
  const x1 = last.x + last.w / 2;
  const px = x0 + (x1 - x0) * t;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(px, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return px;
}

function drawLane(
  ctx: CanvasRenderingContext2D,
  lane: Box[],
  y: number,
  active: boolean,
  pulseX: number | null,
) {
  lane.forEach((b, i) => {
    const cx = b.x + b.w / 2;
    const hot = pulseX !== null && Math.abs(pulseX - cx) < b.w / 2 + 4;
    const tone = active ? (hot ? C.failure : C.contour) : C.border;
    roundBox(ctx, b.x, y, b.w, LANE_H, tone, hot ? 3 : 2);
    drawLabel(ctx, b.label, cx, y + (b.sub ? 17 : LANE_H / 2 + 1), hot ? C.failure : C.text, 11.5, 'center');
    if (b.sub) drawLabel(ctx, b.sub, cx, y + 33, C.muted, 9.5, 'center');
    // Sits in the sub-label row, left of the centered caption, so it never overlaps text.
    if (b.sub === '冻结先验') frostMark(ctx, b.x + 9, y + 33, active ? C.failure : C.border);
    if (i < lane.length - 1) {
      const nx = lane[i + 1].x;
      arrow(ctx, b.x + b.w, y + LANE_H / 2, nx, active ? C.failure : C.border);
    }
  });
}

function drawOld(ctx: CanvasRenderingContext2D, p: number) {
  clearStudio(ctx, W, H);
  drawDesk(ctx, W, H, DESK_Y);
  drawLabel(ctx, '两套接口，两条独立管线', 12, 20, C.failure, 13);

  // Lane 1 runs first, lane 2 second: they never exchange anything mid-flight.
  const t1 = Math.max(0, Math.min(1, p / 0.42));
  const t2 = Math.max(0, Math.min(1, (p - 0.56) / 0.42));
  // Both lanes stay at full contrast: they are both permanent parts of the architecture
  // the paper criticises, so dimming one would read as "not there". Only the travelling
  // pulse moves — which also keeps the reduced-motion freeze frame fully legible.
  const showPulse1 = p > 0.02 && p < 0.5;
  const showPulse2 = p >= 0.56;

  // One caption per lane instead of a title line plus a consequence line. Both lanes name
  // their interface the same way — Chinese term with the acronym in parentheses — so the
  // two sides read as a pair rather than as one translated and one left in English.
  drawLabel(ctx, '理解侧 · 视觉编码器（VE）', 12, 56, C.muted, 10.5);
  const px1 = showPulse1 ? lanePulse(ctx, VE_LANE, VE_Y + LANE_H / 2, t1, C.failure) : null;
  drawLane(ctx, VE_LANE, VE_Y, true, px1);

  // The bifurcation the paper names: different tokenizers / latent spaces, not joint
  // learning. Drawn as a barrier because that is the structural claim, not a delay.
  // Midway between lane 1's bottom edge (y=116) and lane 2's caption (y=196).
  const gapY = 152;
  ctx.save();
  ctx.strokeStyle = C.failure;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(12, gapY);
  ctx.lineTo(W - 12, gapY);
  ctx.stroke();
  ctx.restore();
  const flash = p >= 0.44 && p < 0.56;
  drawLabel(ctx, '表示不共享 · 不同目标与训练流程', W / 2, gapY + 16, flash ? C.failure : C.muted, 10.5, 'center');
  if (flash) {
    ctx.save();
    ctx.strokeStyle = C.failure;
    ctx.lineWidth = 3;
    const cx = W / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 44, gapY - 9);
    ctx.lineTo(cx - 28, gapY + 7);
    ctx.moveTo(cx - 28, gapY - 9);
    ctx.lineTo(cx - 44, gapY + 7);
    ctx.stroke();
    ctx.restore();
  }

  drawLabel(ctx, '生成侧 · 变分自编码器（VAE）', 12, 196, C.muted, 10.5);
  const px2 = showPulse2 ? lanePulse(ctx, VAE_LANE, VAE_Y + LANE_H / 2, t2, C.failure) : null;
  drawLane(ctx, VAE_LANE, VAE_Y, true, px2);

  // One closing line only. The two consequence lines that used to sit here ("语义特征，无法
  // 回写像素" / "潜空间瓶颈 + 深解码头") are already visible as the lane boxes themselves.
  drawLabel(ctx, '两条管线各自成立，接口都不与主干联合学习', W / 2, 300, C.contour, 10, 'center');
}

function drawNew(ctx: CanvasRenderingContext2D, p: number) {
  clearStudio(ctx, W, H);
  drawDesk(ctx, W, H, DESK_Y);
  drawLabel(ctx, '原生统一：一个序列，逐层交互', 12, 20, C.success, 13);
  drawLabel(ctx, 'SenseNova-U1 · NEO-unify 架构', 12, 36, C.muted, 10);

  const inGlow = Math.max(0, Math.min(1, p / 0.16));
  const encT = Math.max(0, Math.min(1, (p - 0.10) / 0.18));
  const stripT = Math.max(0, Math.min(1, (p - 0.26) / 0.16));
  const layerT = Math.max(0, Math.min(1, (p - 0.42) / 0.40));
  const headT = Math.max(0, Math.min(1, (p - 0.82) / 0.18));

  // ---- Native inputs: raw pixels and words, no VE and no VAE in front of them ----
  drawLabel(ctx, '原生输入', IN_X, 56, C.muted, 9.5);
  const cell = 11;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const shade = 0.3 + ((r * 4 + c) % 5) * 0.14;
      ctx.fillStyle = C.desk;
      ctx.globalAlpha = 0.35 + shade * 0.5 * inGlow;
      ctx.fillRect(IN_X + 2 + c * cell, 64 + r * cell, cell - 1.5, cell - 1.5);
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = inGlow > 0.5 ? C.success : C.contour;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(IN_X + 2, 64, cell * 4, cell * 4);
  // Flush under the grid (which ends at y=108), not midway to the word boxes at y=136 —
  // otherwise it reads as a heading for the words rather than a label for the grid.
  drawLabel(ctx, '像素', IN_X + 2 + cell * 2, 119, C.text, 10, 'center');
  ['词', '词', '词'].forEach((w, i) => {
    roundBox(ctx, IN_X + 2, 136 + i * 22, 44, 18, inGlow > 0.5 ? C.success : C.border, 1.6);
    drawLabel(ctx, w, IN_X + 24, 146 + i * 22, C.text, 10, 'center');
  });
  drawLabel(ctx, '原分词器', IN_X + 24, 214, C.muted, 9, 'center');
  drawLabel(ctx, '无 VE', IN_X + 24, 234, C.success, 9.5, 'center');
  drawLabel(ctx, '无 VAE', IN_X + 24, 248, C.success, 9.5, 'center');

  // ---- Two-layer convolutional patch encoding (Section 3.1) --------------------
  arrow(ctx, IN_X + 50, ENC.y + ENC.h / 2, ENC.x, encT > 0.1 ? C.success : C.border);
  roundBox(ctx, ENC.x, ENC.y, ENC.w, ENC.h, encT > 0.1 ? C.success : C.contour, encT > 0.1 ? 2.6 : 2);
  drawLabel(ctx, '2× conv', ENC.x + ENC.w / 2, ENC.y + 16, C.success, 10.5, 'center');
  drawLabel(ctx, '步幅 16 · 2', ENC.x + ENC.w / 2, ENC.y + 31, C.text, 10, 'center');
  drawLabel(ctx, 'GELU + 2D PE', ENC.x + ENC.w / 2, ENC.y + 46, C.muted, 9, 'center');
  // Compression readout: the 32x claim is the headline number of the interface.
  // Left-aligned under the encoder so it cannot run under the sequence strip at x=160.
  drawLabel(ctx, '32×32 → 1 token', ENC.x - 4, ENC.y + ENC.h + 16, C.aux, 9);
  drawLabel(ctx, '32× 压缩', ENC.x - 4, ENC.y + ENC.h + 30, C.aux, 9);

  // ---- Single unified sequence: clean tokens plus noise tokens ------------------
  arrow(ctx, ENC.x + ENC.w, ENC.y + ENC.h / 2, STRIP.x, stripT > 0.1 ? C.success : C.border);
  drawLabel(ctx, '统一序列', STRIP.x + STRIP.w / 2, 58, C.muted, 9.5, 'center');
  for (let i = 0; i < STRIP.rows; i += 1) {
    const y = STRIP.y + i * STRIP.cell;
    const filled = stripT * STRIP.rows > i;
    const noise = i >= 5;
    const tone = !filled ? C.border : noise ? C.aux : C.current;
    ctx.fillStyle = filled ? C.white : C.field;
    ctx.strokeStyle = tone;
    ctx.lineWidth = filled ? 2 : 1;
    ctx.fillRect(STRIP.x, y, STRIP.w, STRIP.cell - 3);
    ctx.strokeRect(STRIP.x, y, STRIP.w, STRIP.cell - 3);
    if (filled) {
      ctx.fillStyle = tone;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(STRIP.x + 3, y + 3, STRIP.w - 6, STRIP.cell - 9);
      ctx.globalAlpha = 1;
    }
  }
  // Right-aligned to the strip's left edge rather than centred under it: the MoT block's
  // caption lines below are centred at x=256 and would otherwise run through these.
  drawLabel(ctx, '干净', STRIP.x - 6, 244, C.current, 9, 'right');
  drawLabel(ctx, '噪声', STRIP.x - 6, 258, C.aux, 9, 'right');

  // ---- Native MoT: shared self-attention per layer, decoupled stream params -----
  roundBox(ctx, MOT.x, MOT.y, MOT.w, MOT.h, layerT > 0 ? C.current : C.contour, 2, false, C.white);
  drawLabel(ctx, '原生 MoT', MOT.x + MOT.w / 2, MOT.y + 14, C.current, 10.5, 'center');
  // Rows start below the title band so the top layer's attention band cannot sit under
  // the "原生 MoT" caption.
  const rowTop = MOT.y + 26;
  const rowH = (MOT.h - 32) / LAYERS;
  for (let i = 0; i < LAYERS; i += 1) {
    // Layers light bottom-up so the "interact natively at every layer" claim reads as
    // repetition, not as a single handoff.
    const cy = rowTop + rowH * (LAYERS - 1 - i) + rowH / 2;
    const lit = layerT * LAYERS > i;
    const undTone = lit ? C.current : C.border;
    const genTone = lit ? C.aux : C.border;
    // Stream-specific projection + Norm + FFN (full parameter decoupling).
    ctx.fillStyle = C.white;
    ctx.strokeStyle = undTone;
    ctx.lineWidth = lit ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.roundRect(MOT.x + 8, cy - 11, 20, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = genTone;
    ctx.beginPath();
    ctx.roundRect(MOT.x + MOT.w - 28, cy - 11, 20, 22, 4);
    ctx.fill();
    ctx.stroke();
    // Shared self-attention band joining the two streams at this layer. Drawn as a
    // filled band rather than a hairline so "every layer" is legible at hero scale.
    const bx = MOT.x + 28;
    const bw = MOT.w - 56;
    if (lit) {
      ctx.save();
      ctx.fillStyle = C.success;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(bx, cy - 8, bw, 16);
      ctx.restore();
    }
    ctx.strokeStyle = lit ? C.success : C.border;
    ctx.lineWidth = lit ? 2.4 : 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, cy);
    ctx.lineTo(bx + bw, cy);
    ctx.stroke();
    // One-way barrier (§3.2): noise tokens have full access to clean inputs, while clean
    // tokens are prevented from attending to any noise tokens.
    //
    // Direction matters here and the two conventions point opposite ways. As a *query→key*
    // arrow this would run generation→understanding (the noise token is the one doing the
    // reading). But with no legend an arrow reads as information flow, and drawn that way
    // it would claim generation feeds understanding — precisely the direction the paper
    // forbids. So the arrow shows information flow, clean→noise, left to right, and the
    // blocked reverse is drawn explicitly as a barred stub rather than left to inference.
    if (lit) {
      const ax = bx + bw * 0.66;
      ctx.fillStyle = C.success;
      ctx.beginPath();
      ctx.moveTo(ax, cy - 5);
      ctx.lineTo(ax + 8, cy);
      ctx.lineTo(ax, cy + 5);
      ctx.closePath();
      ctx.fill();
      // Reverse read, cut: short leftward stub ending in a bar. Muted rather than red —
      // this is the method working as designed, not a failure.
      const sx = bx + bw * 0.3;
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + 9, cy);
      ctx.lineTo(sx + 2, cy);
      ctx.moveTo(sx, cy - 5);
      ctx.lineTo(sx, cy + 5);
      ctx.stroke();
      ctx.restore();
    }
  }
  drawLabel(ctx, '理解', MOT.x + 18, MOT.y + MOT.h + 12, C.current, 9, 'center');
  drawLabel(ctx, '共享注意力', MOT.x + MOT.w / 2, MOT.y + MOT.h + 12, C.success, 9, 'center');
  drawLabel(ctx, '生成', MOT.x + MOT.w - 18, MOT.y + MOT.h + 12, C.aux, 9, 'center');
  // Names the convention explicitly: the arrowhead is information flow, not a query→key
  // edge, so "干净 → 噪声" is the visible direction and the barred stub is the cut one.
  // Kept short — at the end of the cycle the MLP head's pixel blocks occupy x≥328, and a
  // longer centred string would run under them.
  drawLabel(ctx, '干净 → 噪声 · 反向截断', MOT.x + MOT.w / 2, MOT.y + MOT.h + 26, C.muted, 9, 'center');
  drawLabel(ctx, '投影 / Norm / FFN 按流解耦', MOT.x + MOT.w / 2, MOT.y + MOT.h + 40, C.muted, 9, 'center');

  // ---- Asymmetric decoding heads (Section 3.1 Patch Decoding Layer) -------------
  arrow(ctx, MOT.x + MOT.w, HEAD_T.y + HEAD_T.h / 2, HEAD_T.x, headT > 0.1 ? C.current : C.border);
  arrow(ctx, MOT.x + MOT.w, HEAD_P.y + HEAD_P.h / 2, HEAD_P.x, headT > 0.1 ? C.success : C.border);
  roundBox(ctx, HEAD_T.x, HEAD_T.y, HEAD_T.w, HEAD_T.h, headT > 0.1 ? C.current : C.contour, 2);
  drawLabel(ctx, '线性头', HEAD_T.x + HEAD_T.w / 2, HEAD_T.y + 18, C.current, 10.5, 'center');
  drawLabel(ctx, '→ 词表', HEAD_T.x + HEAD_T.w / 2, HEAD_T.y + 34, C.text, 10, 'center');
  roundBox(ctx, HEAD_P.x, HEAD_P.y, HEAD_P.w, HEAD_P.h, headT > 0.1 ? C.success : C.contour, 2);
  drawLabel(ctx, 'MLP 头', HEAD_P.x + HEAD_P.w / 2, HEAD_P.y + 18, C.success, 10.5, 'center');
  drawLabel(ctx, '→ 像素 patch', HEAD_P.x + HEAD_P.w / 2, HEAD_P.y + 34, C.text, 10, 'center');
  // Outputs materialise only at the end of the cycle.
  if (headT > 0.25) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (headT - 0.25) / 0.5);
    ctx.strokeStyle = C.current;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(HEAD_T.x + 8, HEAD_T.y + HEAD_T.h + 10 + i * 7);
      ctx.lineTo(HEAD_T.x + HEAD_T.w - (i === 2 ? 26 : 8), HEAD_T.y + HEAD_T.h + 10 + i * 7);
      ctx.stroke();
    }
    ctx.fillStyle = C.success;
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        ctx.globalAlpha = Math.min(1, (headT - 0.25) / 0.5) * (0.35 + ((r + c) % 3) * 0.22);
        ctx.fillRect(HEAD_P.x + 8 + c * 13, HEAD_P.y + HEAD_P.h + 8 + r * 11, 11, 9);
      }
    }
    ctx.restore();
  }
  drawLabel(ctx, '一条序列贯通两侧，绕开深解码头与 VAE 解码器', W / 2, 300, C.contour, 10, 'center');
}

export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    let startedAt = 0;
    const frame = (now: number) => {
      if (!startedAt) startedAt = now;
      // Reduced motion freezes near the end of the cycle, where every stage is already
      // populated — no information is only available mid-animation.
      const p = reduced ? 0.97 : ((now - startedAt) % CYCLE) / CYCLE;
      if (isNew) drawNew(ctx, p); else drawOld(ctx, p);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [isNew]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={isNew
        ? '本文原生统一架构动画：原生像素与词经两层卷积编码进入统一序列，在原生 MoT 中逐层共享自注意力、按流解耦投影与 FFN；噪声 token 可完整读取干净输入，干净 token 被禁止读取任何噪声 token，因此信息只从干净流向噪声，反向被截断；最后由线性头输出词表、MLP 头输出像素 patch'
        : '传统分裂架构动画：上为带视觉编码器的理解管线，下为带 VAE 的生成管线，两条管线由不同表示连接、不共享同一表示空间'}
    />
  );
};

export default HeroContrast;
