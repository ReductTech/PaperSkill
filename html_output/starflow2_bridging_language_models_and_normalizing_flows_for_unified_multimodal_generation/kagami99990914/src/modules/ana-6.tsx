import React, { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 类比动画：左半幅一次连续引纬织满一行，右半幅被反复补织四次仍留残影（560×140，无控件、无反馈）
const W = 560;
const H = 140;
const DURATION = 2600;

const CLR = {
  field: '#f5f8f0',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  inset: '#ffffff',
  muted: '#68778f',
  axis: '#d7deea',
  ink: '#21324a',
};

type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = CLR.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CLR.axis;
  ctx.fillRect(0, h - 26, w, 8);
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: number[]
): void {
  ctx.fillStyle = CLR.loom;
  ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillRect(16, 10, 6, h - 40);
  ctx.fillRect(w - 22, 10, 6, h - 40);
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = 24 + (i * (w - 48)) / Math.max(1, warpCount - 1);
    const st = warpState ? warpState[i] ?? 1 : 1;
    ctx.strokeStyle = st < 0.5 ? CLR.axis : st > 0.85 ? CLR.warpDeep : CLR.warp;
    ctx.lineWidth = st > 0.85 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, h - 32);
    ctx.stroke();
  }
}

// 半幅织机：顶梁 + 经线 + 织口横线
function drawHalf(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  warpCount: number
): void {
  ctx.fillStyle = CLR.loom;
  ctx.fillRect(x0, 12, x1 - x0, 6);
  ctx.fillRect(x0, 12, 5, 96);
  ctx.fillRect(x1 - 5, 12, 5, 96);
  ctx.strokeStyle = CLR.warp;
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = x0 + 12 + (i * (x1 - x0 - 24)) / Math.max(1, warpCount - 1);
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x, 106);
    ctx.stroke();
  }
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0 + 10, 94);
  ctx.lineTo(x1 - 10, 94);
  ctx.stroke();
}

// 唯一运动主体：梭子
function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
): void {
  const w = 40 * scale;
  const h = 15 * scale;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 24 * scale, y);
  ctx.lineTo(x - w / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.quadraticCurveTo(x, y - h * 0.9, x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.quadraticCurveTo(x, y + h * 0.9, x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: string
): void {
  ctx.save();
  if (mode === 'corner') {
    ctx.fillStyle = CLR.done;
    ctx.fillRect(x, y, 9, 9);
  } else if (mode === 'band') {
    ctx.fillStyle = CLR.done;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, w, 5);
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = CLR.done;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant = 'primary'
): void {
  ctx.fillStyle = variant === 'muted' ? CLR.muted : CLR.ink;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((it, i) => {
    const lx = x + i * 112;
    ctx.fillStyle = it.color;
    ctx.fillRect(lx, y - 9, 12, 9);
    ctx.fillStyle = CLR.muted;
    ctx.fillText(it.label, lx + 18, y);
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  color: string,
  width: number,
  dashed = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = CLR.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CLR.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  if (title) {
    ctx.fillStyle = CLR.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 10, y + 18);
  }
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const LX0 = 24;
    const LX1 = 268;
    const RX0 = 292;
    const RX1 = 536;

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawHalf(ctx, LX0, LX1, 12);
      drawHalf(ctx, RX0, RX1, 12);

      // 左侧：一次连续引纬
      const lp = easeInOutQuad(Math.min(1, t / 0.85));
      const endL = LX0 + 16 + (LX1 - 14 - (LX0 + 16)) * lp;
      drawThread(ctx, { x: LX0 + 12, y: 92 }, { x: endL, y: 92 }, CLR.weave, 3, false);
      if (t >= 0.9) {
        ctx.strokeStyle = CLR.field;
        ctx.lineWidth = 1;
        for (let x = LX0 + 14; x < LX1 - 12; x += 6) {
          ctx.beginPath();
          ctx.moveTo(x, 88);
          ctx.lineTo(x, 96);
          ctx.stroke();
        }
        drawTarget(ctx, LX1 - 18, 88, 12, 'corner');
      }
      drawSubject(ctx, endL, 90, 1, CLR.shuttle);

      // 右侧：反复补织，每 1/4 行程留一条残影
      const rp = 1 - Math.pow(1 - clamp(t / 0.95, 0, 1), 2.2);
      const endR = RX0 + 16 + (RX1 - 14 - (RX0 + 16)) * rp;
      drawThread(ctx, { x: RX0 + 12, y: 92 }, { x: endR, y: 92 }, CLR.weave, 3, false);
      const ghostN = Math.min(4, Math.floor(t * 4.6));
      for (let i = 0; i < ghostN; i++) {
        const gx = RX0 + 16 + (RX1 - 14 - (RX0 + 16)) * ((i + 1) / 5);
        drawThread(ctx, { x: gx, y: 84 }, { x: gx, y: 96 }, CLR.bad, 1.5, true);
      }
      if (t >= 0.95) {
        ctx.fillStyle = CLR.bad;
        ctx.fillRect(RX1 - 46, 90, 14, 4);
        ctx.fillRect(RX1 - 24, 90, 10, 4);
      }
      drawSubject(ctx, endR, 90, 1, CLR.shuttle);
    };

    const tick = () => {
      const t = (performance.now() % DURATION) / DURATION;
      render(t);
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

export default Ana6;
