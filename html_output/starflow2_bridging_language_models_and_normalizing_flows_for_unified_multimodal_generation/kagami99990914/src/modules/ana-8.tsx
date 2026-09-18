import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* ------------------------------------------------------------------ */
/* Paper-specific drawing kit — duplicated locally in every widget.    */
/* ------------------------------------------------------------------ */

const C = {
  bg: '#f5f8f0',
  bench: '#d7deea',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  inset: '#ffffff',
};

function warpXs(w: number): number[] {
  const count = Math.max(6, Math.round((w - 120) / 24));
  const xs: number[] = [];
  for (let i = 0; i <= count; i += 1) xs.push(60 + ((w - 120) / count) * i);
  return xs;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.bench;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C.warp;
  ctx.lineWidth = 2;
  warpXs(w).forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: Record<number, 'dim' | 'active'>
) {
  ctx.strokeStyle = C.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(w - 20, 12);
  ctx.moveTo(20, h - 32);
  ctx.lineTo(w - 20, h - 32);
  ctx.moveTo(26, 12);
  ctx.lineTo(26, h - 32);
  ctx.moveTo(w - 26, 12);
  ctx.lineTo(w - 26, h - 32);
  ctx.stroke();

  const xs = warpXs(w).slice(0, Math.max(1, warpCount));
  xs.forEach((x, i) => {
    const st = warpState ? warpState[i] : undefined;
    ctx.strokeStyle = st === 'active' ? C.cross : st === 'dim' ? '#e4ead9' : C.warp;
    ctx.lineWidth = st === 'active' ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
) {
  const w = 34 * scale;
  const h = 14 * scale;
  const left = x - w / 2;
  const top = y - h / 2;
  const r = h / 2;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + w - r, top);
  ctx.quadraticCurveTo(left + w, top, left + w, top + r);
  ctx.quadraticCurveTo(left + w, top + h, left + w - r, top + h);
  ctx.lineTo(left + r, top + h);
  ctx.quadraticCurveTo(left, top + h, left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left - 24 * scale, y);
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  stateColor: string,
  width: number
) {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'row' | 'selvedge' | 'density'
) {
  if (mode === 'selvedge') {
    ctx.fillStyle = C.done;
    ctx.fillRect(x, y - 9, w, 18);
    return;
  }
  ctx.save();
  ctx.strokeStyle = C.done;
  ctx.lineWidth = 2;
  if (mode === 'row') ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'primary' | 'muted' | 'inverse'
) {
  ctx.fillStyle = variant === 'muted' ? C.muted : variant === 'inverse' ? '#ffffff' : C.ink;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: Array<{ label: string; color: string }>
) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 8, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 14 + ctx.measureText(it.label).width + 18;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  width: number,
  dashed: boolean
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
) {
  ctx.fillStyle = C.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 16);
  }
}

/* ------------------------------------------------------------------ */
/* ana-8 · 上下来回穿，才织成一块 — 560×140 life animation only        */
/* 蓝色上层线束与橙色下层线束在 4 个交叉点依次上下互换，合成交叉织面。 */
/* ------------------------------------------------------------------ */

const W = 560;
const H = 140;
const CYCLE = 3000;
const XS = [150, 230, 310, 390];
const BLUE_Y = 50;
const ORG_Y = 86;
const MID_Y = (BLUE_Y + ORG_Y) / 2;

function levelAt(x: number, isBlue: boolean, reveal: number): number {
  let y = isBlue ? BLUE_Y : ORG_Y;
  for (let i = 0; i < XS.length; i += 1) {
    const done = clamp(reveal - i, 0, 1);
    if (done <= 0) continue;
    const g = clamp((x - (XS[i] - 18)) / 36, 0, 1);
    const s = g * g * (3 - 2 * g);
    const dir = isBlue ? (i % 2 === 0 ? 1 : -1) : i % 2 === 0 ? -1 : 1;
    y += dir * (ORG_Y - BLUE_Y) * s * done;
  }
  return y;
}

function strandPoints(isBlue: boolean, reveal: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let x = 80; x <= 480; x += 3) pts.push([x, levelAt(x, isBlue, reveal)]);
  return pts;
}

function drawStrand(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  color: string,
  width: number,
  underAt: number[]
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  let started = false;
  ctx.beginPath();
  pts.forEach(([x, y]) => {
    const gapped = underAt.some((cx) => Math.abs(x - cx) < 7);
    if (gapped) {
      started = false;
      return;
    }
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();

    const draw = (now: number) => {
      const t = ((now - t0) / CYCLE) % 1;
      const reveal = t * (XS.length + 0.35);

      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, warpXs(W).length);

      const bluePts = strandPoints(true, reveal);
      const orgPts = strandPoints(false, reveal);

      // 交叉点已完成后，被压住的那根线在交叉处留缝，形成“上下交叠”
      const blueUnder = XS.filter((_, i) => i % 2 === 1 && reveal >= i + 1);
      const orgUnder = XS.filter((_, i) => i % 2 === 0 && reveal >= i + 1);

      drawStrand(ctx, orgPts, C.shuttle, 3, orgUnder);
      drawStrand(ctx, bluePts, C.weave, 3, blueUnder);

      // 交叉点高亮
      XS.forEach((cx, i) => {
        const done = reveal >= i + 1;
        ctx.fillStyle = done ? C.cross : C.axis;
        ctx.beginPath();
        ctx.arc(cx, MID_Y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 已合成的交叉织面（收边）
      const grown = clamp(reveal / XS.length, 0, 1);
      drawThread(ctx, [80, 106], [80 + 400 * grown, 106], C.done, 4, false);
      if (grown >= 1) drawTarget(ctx, 470, 106, 12, 'selvedge');

      drawSceneLabel(ctx, 84, 30, '交叉点', 'muted');
    };

    const tick = (now: number) => {
      draw(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana8;
