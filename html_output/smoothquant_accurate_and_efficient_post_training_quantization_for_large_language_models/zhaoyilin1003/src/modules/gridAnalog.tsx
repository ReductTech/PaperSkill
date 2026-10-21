import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 共享类比动画：连续值在量化网格上「吸附」到最近的刻度点。
const W = 560;
const H = 140;

export const GridAnalog: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const start = performance.now();
    const render = (t: number) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const n = 8;
      const x0 = 40;
      const x1 = W - 40;
      const y = H * 0.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      for (let i = 0; i <= n; i += 1) {
        const x = x0 + (i / n) * (x1 - x0);
        ctx.fillStyle = COLORS.muted;
        ctx.fillRect(x - 2, y - 7, 4, 14);
      }
      const u = ((t - start) % 2600) / 2600;
      const cx = x0 + u * (x1 - x0);
      const snap = x0 + Math.round((cx - x0) / ((x1 - x0) / n)) * ((x1 - x0) / n);
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.arc(cx, y - 28, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(snap, y, 7, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '量化：吸附到刻度', W / 2, 26, COLORS.ink, 18, 'center');
    };
    const tick = (t: number) => {
      render(t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} aria-label="量化网格" />;
};

export default GridAnalog;
