import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawMicroscope,
  drawTissueField,
  drawVessel,
} from './viz-kit';

// Hero side panels (slide 0), 520x200, same microscope bench on both sides:
//   moduleId="old" — the old way: one high-power look at a single spot. The field holds
//                    nothing but normal glands, while the real vessel invasion sits
//                    OUTSIDE the field: dimmed, red-circled, never looked at.
//   moduleId="new" — the paper's way: the same microscope steps 4x -> 10x -> 40x, a blue
//                    coarse-to-fine path narrows onto the lesion and the field turns green.
// Gentle automatic loop, no learner controls, exactly ONE in-canvas label, no legend.

const W = 520;
const H = 200;

type Mag = 1.25 | 5 | 20;
type Lesion = 'none' | 'vessel' | 'pearl';
type Objective = 0 | 1 | 2;

const LOOP_OLD = 3600;
const LOOP_NEW = 4800;

// Microscope field of view — identical geometry on both panels.
const FX = 156;
const FY = 22;
const FW = 172;
const FH = 112;
const SEED = 8801;

// The unseen lesion on the old panel (outside the field of view).
const MISS_CX = 438;
const MISS_CY = 120;
const MISS_R = 40;

// ---------------------------------------------------------------------------
// local helpers
// ---------------------------------------------------------------------------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** The eyepiece bracket that ties the microscope to the field of view beside it. */
function drawLink(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = SKIN.metal;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 104);
  ctx.lineTo(FX - 6, 100);
  ctx.stroke();
  ctx.restore();
}

/** A tapered blue ribbon: wide at the coarse end, thin at the fine end. */
function drawRibbon(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  hw1: number,
  hw2: number,
  cxp: number,
  cyp: number,
  alpha: number
): void {
  const a1 = Math.atan2(cyp - y1, cxp - x1);
  const a2 = Math.atan2(y2 - cyp, x2 - cxp);
  const n1x = Math.cos(a1 - Math.PI / 2);
  const n1y = Math.sin(a1 - Math.PI / 2);
  const n2x = Math.cos(a2 - Math.PI / 2);
  const n2y = Math.sin(a2 - Math.PI / 2);
  ctx.save();
  ctx.globalAlpha = alpha * 0.24;
  ctx.fillStyle = SKIN.blue;
  ctx.beginPath();
  ctx.moveTo(x1 + n1x * hw1, y1 + n1y * hw1);
  ctx.quadraticCurveTo(cxp, cyp, x2 + n2x * hw2, y2 + n2y * hw2);
  ctx.lineTo(x2 - n2x * hw2, y2 - n2y * hw2);
  ctx.quadraticCurveTo(cxp, cyp, x1 - n1x * hw1, y1 - n1y * hw1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = SKIN.blue;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cxp, cyp, x2, y2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// panel renderers
// ---------------------------------------------------------------------------

function renderOld(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const objective: Objective = 2; // 高倍局部：只看一处
  // drawMicroscope 的 (x, y) 是整机中心，scale 0.6 时底座正好落在台面上
  drawMicroscope(ctx, 78, 116, 0.6, { objective });
  drawLink(ctx);

  // 镜下视野：只有正常腺体
  drawTissueField(ctx, FX, FY, FW, FH, {
    seed: SEED,
    magnification: 1.25,
    lesion: 'none',
  });

  // 视野之外的血管侵犯：从未被看过，保持灰暗
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawVessel(ctx, 396, 142, 94, -0.42, true);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = SKIN.metalDark;
  roundRectPath(ctx, 372, 82, 140, 88, 10);
  ctx.fill();
  ctx.restore();

  // 红圈标出漏掉的区域
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = SKIN.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(MISS_CX, MISS_CY, MISS_R + pulse * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, 24, 30, '高倍局部', SKIN.text, 15);
}

function renderNew(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  let step = 0;
  let mix = 0;
  if (p < 0.26) {
    step = 0;
    mix = 0;
  } else if (p < 0.44) {
    step = 1;
    mix = (p - 0.26) / 0.18;
  } else if (p < 0.58) {
    step = 1;
    mix = 0;
  } else if (p < 0.80) {
    step = 2;
    mix = (p - 0.58) / 0.22;
  } else {
    step = 2;
    mix = 1;
  }

  const objective: Objective = step === 0 ? 0 : step === 1 ? 1 : 2;
  drawMicroscope(ctx, 78, 116, 0.6, { objective });
  drawLink(ctx);

  // 由粗到细：先低倍兜底，再逐级推进到高倍
  const mags: Mag[] = [1.25, 5, 20];
  const lo: Mag = step === 0 ? mags[0] : mags[step - 1];
  const hi: Mag = mags[step];
  const lesionLo: Lesion = 'none';
  const lesionHi: Lesion = hi === 20 ? 'vessel' : 'none';

  drawTissueField(ctx, FX, FY, FW, FH, { seed: SEED, magnification: lo, lesion: lesionLo });
  if (mix > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(mix, 0, 1);
    drawTissueField(ctx, FX, FY, FW, FH, { seed: SEED, magnification: hi, lesion: lesionHi });
    ctx.restore();
  }

  // 蓝色「由粗到细」路径：粗的一头在视野左上，细的一头指向血管侵犯
  const grow = easeOutCubic(clamp((p - 0.04) / 0.62, 0, 1));
  if (grow > 0) {
    const x1 = FX + 30;
    const y1 = FY + 26;
    const tx = FX + FW / 2 - 6;
    const ty = FY + FH * 0.68;
    const cxp = (x1 + tx) / 2 + 18;
    const cyp = (y1 + ty) / 2 - 14;
    const ex = lerp(x1, tx, grow);
    const ey = lerp(y1, ty, grow);
    drawRibbon(ctx, x1, y1, ex, ey, 22, lerp(22, 4.5, grow), cxp, cyp, 0.55 + 0.45 * grow);
    if (grow > 0.9) {
      ctx.save();
      ctx.globalAlpha = (grow - 0.9) / 0.1;
      ctx.strokeStyle = SKIN.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 找到血管内肿瘤细胞：整个视野转 green
  const found = clamp((p - 0.74) / 0.14, 0, 1);
  if (found > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = found * (0.06 + 0.05 * pulse);
    ctx.fillStyle = SKIN.green;
    roundRectPath(ctx, FX, FY, FW, FH, 16);
    ctx.fill();
    ctx.globalAlpha = found;
    ctx.lineWidth = 3;
    ctx.strokeStyle = SKIN.green;
    roundRectPath(ctx, FX, FY, FW, FH, 16);
    ctx.stroke();
    ctx.globalAlpha = found * 0.3;
    ctx.lineWidth = 9;
    roundRectPath(ctx, FX, FY, FW, FH, 16);
    ctx.stroke();
    ctx.globalAlpha = found;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(FX + FW / 2 - 6, FY + FH * 0.68, 24 + pulse * 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabel(ctx, 24, 30, '先粗后细', SKIN.text, 15);
}

export const HeroScan: React.FC<WidgetProps> = ({ moduleId }) => {
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

    const isNew = moduleId === 'new';
    const loop = isNew ? LOOP_NEW : LOOP_OLD;
    const started = performance.now();
    let first = true;

    const tick = (): void => {
      const p = ((performance.now() - started) % loop) / loop;
      if (isNew) renderNew(ctx, p);
      else renderOld(ctx, p);
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default HeroScan;
