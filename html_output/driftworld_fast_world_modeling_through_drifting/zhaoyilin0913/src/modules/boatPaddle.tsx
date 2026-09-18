import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS } from './river';
import type { WidgetProps } from './registry';

// Hero「传统方法」：扩散像逆流划桨，一下一下地前进，速度慢且费力。
const W = 480;
const H = 180;

export const BoatPaddle: React.FC<WidgetProps> = () => {
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
      const loop = 3400;
      const u = ((t - start) % loop) / loop;
      drawRiver(ctx, W, H, Math.sin(t / 260) * 2.5);
      drawDock(ctx, W - 42, H * 0.6, COLORS.red);
      // 划桨产生的小幅抖动：船每次向前一点，又轻微回退。
      const x = 48 + u * (W - 108) + Math.sin(t / 110) * 5;
      drawBoat(ctx, x, H * 0.6 + Math.sin(t / 140) * 2, 0.9, COLORS.red, COLORS.muted);
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="扩散方法：船反复划桨" />;
};

export default BoatPaddle;
