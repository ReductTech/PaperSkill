import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 两侧共用：左边留样杯 = 旧任务，右边品茗杯 = 新任务。
// moduleId "old" 只做微调：留样杯褪色、液面下降；moduleId "new" 是 LwF：两杯都满。
const W = 480;
const H = 200;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  porcelain: '#ece6d9',
  tea: '#a9713a',
  ink: '#21324a',
  axis: '#d7deea',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function cup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  level: number,
  tint: string
) {
  const w = 56 * s;
  const h = 58 * s;
  const top = y - h;
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w * 0.36, y);
  ctx.lineTo(x - w * 0.36, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const liquidH = (h - 8) * clamp(level, 0, 1);
  ctx.fillStyle = tint;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.44, top + 4);
  ctx.lineTo(x + w * 0.44, top + 4);
  ctx.lineTo(x + w * 0.36, top + 4 + liquidH);
  ctx.lineTo(x - w * 0.36, top + 4 + liquidH);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export const HeroTea: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sideRef = useRef(moduleId);
  sideRef.current = moduleId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const startAt = performance.now();

    const draw = (now: number) => {
      const cycle = 3200;
      const raw = ((now - startAt) % cycle) / cycle;
      // 前 62% 是变化，后半段保持终态便于对比。
      const p = easeOutCubic(clamp(raw / 0.62, 0, 1));
      const isOld = sideRef.current === 'old';

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.table;
      ctx.fillRect(0, 160, W, 26);
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(W, 160);
      ctx.stroke();

      const oldLevel = isOld ? 0.88 - 0.46 * p : 0.88 - 0.06 * p;
      const newLevel = 0.12 + 0.62 * p;
      const oldTint = isOld ? lerpColor(C.tea, '#b6b1a4', p) : lerpColor(C.tea, '#a9713a', p);

      cup(ctx, 140, 162, 1.25, oldLevel, oldTint);
      cup(ctx, 330, 162, 1.25, newLevel, C.tea);

      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(238, 74);
      ctx.lineTo(238, 162);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(draw);
    };

    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(draw);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`hero-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroTea;
