import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawSlide,
  drawMicroscope,
  drawTissueField,
  drawReportSheet,
  drawStainJar,
} from './viz-kit';

// Analogy card B (560x140) for chapters 6-10 — same pathology bench, five more
// concrete actions: 逐级放大找血管 / 练描述 / 派活 / 核对染色 / 比读片.
// Automatic loop 3.4-3.6 s, no learner controls, exactly ONE in-canvas label.

const W = 560;
const H = 140;

type Mag = 1.25 | 5 | 20;
type Lesion = 'none' | 'vessel' | 'pearl';
type Objective = 0 | 1 | 2;

const DURATION: Record<string, number> = {
  'chap-6': 3.4,
  'chap-7': 3.6,
  'chap-8': 3.4,
  'chap-9': 3.6,
  'chap-10': 3.6,
};

const LABEL: Record<string, string> = {
  'chap-6': '逐级放大',
  'chap-7': '写短写准',
  'chap-8': '分好工',
  'chap-9': '核对染色',
  'chap-10': '比一比',
};

const LABEL_POS: Record<string, [number, number]> = {
  'chap-6': [392, 30],
  'chap-7': [24, 132],
  'chap-8': [24, 132],
  'chap-9': [24, 26],
  'chap-10': [24, 26],
};

// chap-7: the same finding written long, then written short.
const LONG_LINES = ['边界清楚滤泡规则', '间质纤维化明显', '核仁可见轻度增大'];
const SHORT_LINES = ['边界清楚', '间质纤维化', '核仁可见'];

// ---------------------------------------------------------------------------
// local deterministic helpers
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

function metalLink(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.save();
  ctx.strokeStyle = SKIN.metal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Microscope field of view; the incoming magnification cross-dissolves over the current one. */
function foldField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lo: Mag,
  hi: Mag,
  mix: number,
  seed: number,
  lesionHi: Lesion
): void {
  drawTissueField(ctx, x, y, w, h, { seed, magnification: lo, lesion: 'none' });
  if (mix > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(mix, 0, 1);
    drawTissueField(ctx, x, y, w, h, { seed, magnification: hi, lesion: lesionHi });
    ctx.restore();
  }
}

/** A green "found it" frame + pulse around a microscope field. */
function foundFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
  pulse: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha * 0.28;
  ctx.strokeStyle = SKIN.green;
  ctx.lineWidth = 9;
  roundRectPath(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  roundRectPath(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.globalAlpha = alpha * (0.1 + 0.1 * pulse);
  ctx.fillStyle = SKIN.green;
  roundRectPath(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.restore();
}

/** Pen: nib at (x, y), body along the rotated +x axis. */
function drawPen(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, -3.6);
  ctx.lineTo(12, 3.6);
  ctx.closePath();
  ctx.fillStyle = SKIN.metalDark;
  ctx.fill();
  roundRectPath(ctx, 12, -4.4, 44, 8.8, 4.4);
  ctx.fillStyle = SKIN.blue;
  ctx.fill();
  ctx.restore();
}

/** Small printed tag (rounded rectangle + one short line) used by the assignment board. */
function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  ang: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = SKIN.metalDark;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 9, 1);
  ctx.lineTo(w / 2 - 9, 1);
  ctx.strokeStyle = SKIN.paper;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.restore();
}

/** Quadratic point/tangent helpers for the flying tags. */
function quadPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number
): [number, number] {
  const u = 1 - t;
  return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
}

// ---------------------------------------------------------------------------
// scenes
// ---------------------------------------------------------------------------

/** chap-6 逐级放大找血管: 4x -> 10x -> 40x, the vessel invasion only resolves at the top power. */
function sceneChap6(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const step = Math.min(2, Math.floor(p * 3));
  const f = p * 3 - step;
  const objective: Objective = step === 0 ? 0 : step === 1 ? 1 : 2;
  // drawMicroscope 的 (x, y) 是整机中心；scale 0.44 时底座落在台面上
  drawMicroscope(ctx, 62, 71, 0.44, { objective });

  const fx = 120;
  const fy = 16;
  const fw = 236;
  const fh = 96;
  metalLink(ctx, 96, 66, fx - 6, 64);

  const mags: Mag[] = [1.25, 5, 20];
  const lo: Mag = step === 0 ? mags[0] : mags[step - 1];
  const hi: Mag = mags[step];
  const mix = step === 0 ? 0 : clamp(f / 0.3, 0, 1);
  foldField(ctx, fx, fy, fw, fh, lo, hi, mix, 5100, hi === 20 ? 'vessel' : 'none');

  if (step === 2) {
    const found = clamp((f - 0.34) / 0.3, 0, 1);
    if (found > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
      foundFrame(ctx, fx, fy, fw, fh, found, pulse);
    }
  }

  drawLabel(ctx, LABEL_POS['chap-6'][0], LABEL_POS['chap-6'][1], LABEL['chap-6'], SKIN.text, 14);
}

/** chap-7 练描述: the pen writes a long line, strikes the surplus, writes the short line — three rounds. */
function sceneChap7(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const sheetX = 142;
  const sheetY = 12;
  const sheetW = 298;
  const sheetH = 106;
  // drawSheet 布局：第一行横线在 y≈41，文字左起 x≈152（12px 字号，每字约 12px）
  const txtX = 152;
  const charW = 12;
  const baseY = 41;

  const rep = Math.min(2, Math.floor(p * 3));
  const f = p * 3 - rep;
  const longLine = LONG_LINES[rep];
  const shortLine = SHORT_LINES[rep];

  let shown = longLine;
  if (f >= 0.68) shown = shortLine;
  else if (f < 0.44) {
    const k = easeInOutQuad(clamp(f / 0.44, 0, 1));
    shown = longLine.slice(0, Math.max(1, Math.ceil(k * longLine.length)));
  }
  drawReportSheet(ctx, sheetX, sheetY, sheetW, sheetH, [shown]);

  const strike = f >= 0.44 && f < 0.68 ? clamp((f - 0.44) / 0.1, 0, 1) : 0;
  if (strike > 0) {
    const x0 = txtX + shortLine.length * charW;
    const x1 = txtX + longLine.length * charW + 3;
    ctx.save();
    ctx.strokeStyle = SKIN.red;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 - 3, baseY - 9);
    ctx.lineTo(lerp(x0 - 3, x1, strike), baseY - 9);
    ctx.stroke();
    ctx.restore();
  }

  let px = txtX + shown.length * charW;
  let py = baseY - 3;
  let ang = -0.62;
  if (f >= 0.68) {
    const k = easeInOutQuad(clamp((f - 0.68) / 0.32, 0, 1));
    px = txtX + shortLine.length * charW + 24 + k * 16;
    py = baseY - 15 - k * 6;
    ang = -0.85;
  }
  drawPen(ctx, px, py, ang);

  drawLabel(ctx, LABEL_POS['chap-7'][0], LABEL_POS['chap-7'][1], LABEL['chap-7'], SKIN.text, 14);
}

/** chap-8 派活: printed tags leave the slide and stick into the cells of the assignment board. */
function sceneChap8(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  drawSlide(ctx, 18, 26, 214, 88, { tissue: 'section' });

  const bx = 292;
  const by = 18;
  const bw = 236;
  const bh = 104;

  ctx.save();
  roundRectPath(ctx, bx, by, bw, bh, 9);
  ctx.fillStyle = SKIN.paper;
  ctx.fill();
  ctx.strokeStyle = SKIN.benchDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  roundRectPath(ctx, bx, by, bw, bh, 9);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = SKIN.blue;
  ctx.fillRect(bx, by, bw, 20);
  ctx.restore();
  ctx.restore();

  const padX = 14;
  const padY = 28;
  const gap = 10;
  const cw = (bw - padX * 2 - gap) / 2;
  const ch = (bh - padY - 12 - gap) / 2;
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 2; c += 1) {
      cells.push({ x: bx + padX + c * (cw + gap), y: by + padY + r * (ch + gap) });
    }
  }
  ctx.save();
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1.5;
  for (const cell of cells) {
    roundRectPath(ctx, cell.x, cell.y, cw, ch, 5);
    ctx.stroke();
  }
  ctx.restore();

  const cellMid = (i: number): [number, number] => [cells[i].x + cw / 2, cells[i].y + ch / 2];

  // 已经贴好的一枚
  const stuck0 = cellMid(2);
  drawTag(ctx, stuck0[0], stuck0[1], 74, 20, SKIN.green, 0);

  const fromX = 226;
  const fromY = 68;
  const flights: { cell: number; t0: number; dur: number; color: string }[] = [
    { cell: 0, t0: 0.08, dur: 0.26, color: SKIN.blue },
    { cell: 3, t0: 0.50, dur: 0.26, color: SKIN.orange },
  ];

  for (const fl of flights) {
    const k = clamp((p - fl.t0) / fl.dur, 0, 1);
    if (k <= 0) continue;
    const e = easeInOutQuad(k);
    const mid = cellMid(fl.cell);
    const cp = quadPoint(fromX, fromY, (fromX + mid[0]) / 2, Math.min(fromY, mid[1]) - 54, mid[0], mid[1], e);
    drawTag(ctx, cp[0], cp[1], 74, 20, fl.color, lerp(-0.5, 0, e));
    if (k >= 1) {
      const g = clamp((p - (fl.t0 + fl.dur)) / 0.14, 0, 1);
      if (g < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - g) * 0.7;
        ctx.strokeStyle = fl.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mid[0], mid[1], lerp(16, 34, g), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawLabel(ctx, LABEL_POS['chap-8'][0], LABEL_POS['chap-8'][1], LABEL['chap-8'], SKIN.text, 14);
}

/** chap-9 核对染色: the slide dips towards the jar, is pulled back and gets a red cross. */
function sceneChap9(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const level = 0.54 + 0.05 * Math.sin(p * Math.PI * 2);
  drawStainJar(ctx, 372, 52, 88, 76, level);

  let k = 0;
  if (p < 0.34) k = easeInOutQuad(p / 0.34);
  else if (p < 0.52) k = 1;
  else if (p < 0.78) k = 1 - easeInOutQuad((p - 0.52) / 0.26);
  else k = 0;

  const cx = lerp(150, 296, k);
  const cy = lerp(68, 44, k);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(lerp(0, -0.16, k));
  drawSlide(ctx, -100, -28, 200, 56, { tissue: 'section' });

  const cross = clamp((p - 0.62) / 0.16, 0, 1);
  if (cross > 0) {
    ctx.save();
    ctx.globalAlpha = cross;
    ctx.strokeStyle = SKIN.red;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, -13);
    ctx.lineTo(13, 13);
    ctx.moveTo(13, -13);
    ctx.lineTo(-13, 13);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  drawLabel(ctx, LABEL_POS['chap-9'][0], LABEL_POS['chap-9'][1], LABEL['chap-9'], SKIN.text, 14);
}

/** chap-10 比读片: two microscopes, the right one steps up and finds the vessel invasion sooner. */
function sceneChap10(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  // 左侧：始终粗看，只有腺体
  drawMicroscope(ctx, 58, 79, 0.36, { objective: 0 });
  metalLink(ctx, 88, 62, 94, 62);
  drawTissueField(ctx, 96, 18, 146, 88, { seed: 9201, magnification: 1.25, lesion: 'none' });

  // 右侧：1.25x -> 5x -> 20x，更早看到血管内肿瘤细胞
  let step = 0;
  let mix = 0;
  if (p < 0.30) {
    step = 0;
    mix = 0;
  } else if (p < 0.46) {
    step = 1;
    mix = (p - 0.30) / 0.16;
  } else if (p < 0.62) {
    step = 1;
    mix = 0;
  } else if (p < 0.80) {
    step = 2;
    mix = (p - 0.62) / 0.18;
  } else {
    step = 2;
    mix = 1;
  }

  const objective: Objective = step === 0 ? 0 : step === 1 ? 1 : 2;
  drawMicroscope(ctx, 338, 79, 0.36, { objective });
  metalLink(ctx, 368, 62, 374, 62);

  const fx = 376;
  const fy = 18;
  const fw = 146;
  const fh = 88;
  const mags: Mag[] = [1.25, 5, 20];
  const lo: Mag = step === 0 ? mags[0] : mags[step - 1];
  const hi: Mag = mags[step];
  foldField(ctx, fx, fy, fw, fh, lo, hi, mix, 9202, hi === 20 ? 'vessel' : 'none');

  const found = clamp((p - 0.78) / 0.14, 0, 1);
  if (found > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    foundFrame(ctx, fx, fy, fw, fh, found, pulse);
  }

  drawLabel(ctx, LABEL_POS['chap-10'][0], LABEL_POS['chap-10'][1], LABEL['chap-10'], SKIN.text, 14);
}

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, t: number): void {
  switch (chapterId) {
    case 'chap-7':
      sceneChap7(ctx, t);
      break;
    case 'chap-8':
      sceneChap8(ctx, t);
      break;
    case 'chap-9':
      sceneChap9(ctx, t);
      break;
    case 'chap-10':
      sceneChap10(ctx, t);
      break;
    default:
      sceneChap6(ctx, t);
      break;
  }
}

export const AnalogySceneB: React.FC<WidgetProps> = ({ chapterId }) => {
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

    const duration = (DURATION[chapterId] ?? 3.4) * 1000;
    const started = performance.now();
    let first = true;

    const tick = (): void => {
      const t = ((performance.now() - started) % duration) / duration;
      drawScene(ctx, chapterId, t);
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
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-ana`} ref={canvasRef} width={W} height={H} />;
};

export default AnalogySceneB;
