import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text, roundedRect } from './qkit';
import type { WidgetProps } from './registry';

// Hero「传统方法」：FP32 全精度，内存占用大。
const W = 520;
const H = 180;

export const Fp32Bar: React.FC<WidgetProps> = () => {
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
    const render = (t: number) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const n = 4;
      const gap = 14;
      const bw = (W - 80 - gap * (n - 1)) / n;
      for (let i = 0; i < n; i += 1) {
        const x = 40 + i * (bw + gap);
        const h = H - 92 - Math.sin(t / 600 + i) * 6;
        roundedRect(ctx, x, H - 62 - h, bw, h, 6);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
      }
      text(ctx, '32-bit 全精度', W / 2, 34, COLORS.ink, 24, 'center');
      text(ctx, '内存占用大', W / 2, H - 20, COLORS.muted, 18, 'center');
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="32位全精度" />;
};

export default Fp32Bar;
