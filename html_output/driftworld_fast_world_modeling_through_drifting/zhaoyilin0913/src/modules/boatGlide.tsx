import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS } from './river';
import type { WidgetProps } from './registry';

// Hero「本文方法」：船顺着水流一次漂到码头，快速且顺滑。
const W = 480;
const H = 180;

export const BoatGlide: React.FC<WidgetProps> = () => {
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
      const loop = 3000;
      const u = ((t - start) % loop) / loop;
      drawRiver(ctx, W, H, Math.sin(t / 500) * 2);
      drawDock(ctx, W - 42, H * 0.6, COLORS.green);
      const x = 48 + u * (W - 108);
      drawBoat(ctx, x, H * 0.6, 0.9, COLORS.blue, COLORS.green);
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="漂移方法：船一次顺流到岸" />;
};

export default BoatGlide;
