import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text, roundedRect } from './qkit';
import type { WidgetProps } from './registry';

// Hero「本文方法」：低位量化，内存占用小。
const W = 520;
const H = 180;

export const Int4Bar: React.FC<WidgetProps> = () => {
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
      const bw = W - 80;
      const h = H - 92 - Math.sin(t / 600) * 6;
      roundedRect(ctx, 40, H - 62 - h, bw, h, 6);
      ctx.fillStyle = COLORS.green;
      ctx.fill();
      text(ctx, '4-bit 量化', W / 2, 34, COLORS.ink, 24, 'center');
      text(ctx, '内存占用小', W / 2, H - 20, COLORS.muted, 18, 'center');
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="4位量化" />;
};

export default Int4Bar;
