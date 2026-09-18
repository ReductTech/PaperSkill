import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* ------------------------------------------------------------------ */
/* Paper-specific drawing kit — duplicated locally in every widget,    */
/* because widgets may only import from `react` and `../lib/canvasKit`. */
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
/* ana-7 · 预判落点，再压下去 — 560×140 life animation only            */
/* 打纬刀对同一行连续预判 5 次：前两次明显偏移，中段收拢，末次对齐停住。 */
/* ------------------------------------------------------------------ */

const W = 560;
const H = 140;
const CYCLE = 2800;
const SEG = 5;
const OFFSETS = [46, 30, 16, 6, 0];
const SEG_COLORS = [C.bad, C.bad, C.shuttle, C.shuttle, C.done];
const TARGET_X = 280;

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, warpXs(W).length);

      const rowY = 92;
      const rulerY = 108;

      // 目标刻度尺
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(160, rulerY);
      ctx.lineTo(400, rulerY);
      ctx.stroke();
      for (let i = 0; i <= 12; i += 1) {
        const x = 160 + i * 20;
        const tall = i === 6;
        ctx.strokeStyle = tall ? C.shuttle : C.axis;
        ctx.lineWidth = tall ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, tall ? rulerY - 9 : rulerY - 5);
        ctx.lineTo(x, rulerY + 4);
        ctx.stroke();
      }
      drawThread(ctx, [TARGET_X, 44], [TARGET_X, rulerY], C.shuttle, 1, true);

      const k = Math.min(SEG - 1, Math.floor(t * SEG));
      const local = t * SEG - k;
      const down = easeOutCubic(clamp(local / 0.5, 0, 1));
      const up = k < SEG - 1 ? clamp((local - 0.72) / 0.28, 0, 1) : 0;
      const bx = TARGET_X + OFFSETS[k];
      const by = lerp(30, rowY - 6, down) - up * 58;

      // 历次落点留痕
      for (let i = 0; i <= k; i += 1) {
        ctx.save();
        ctx.globalAlpha = i === k ? 1 : 0.25;
        drawThread(
          ctx,
          [TARGET_X + OFFSETS[i], rowY - 7],
          [TARGET_X + OFFSETS[i], rowY + 6],
          SEG_COLORS[i],
          3,
          false
        );
        ctx.restore();
      }

      if (k === SEG - 1) {
        drawTarget(ctx, TARGET_X - 10, rowY + 16, 20, 'selvedge');
      }

      drawSubject(ctx, bx, by, 1, SEG_COLORS[k]);
      drawSceneLabel(ctx, 408, 30, '目标刻度', 'muted');
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

export default Ana7;
