import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS } from './river';
import type { WidgetProps } from './registry';

// 全教程共享的类比动画：一叶扁舟顺流而下，一次漂到码头，然后循环。
const W = 560;
const H = 140;

export const BoatAnalogy: React.FC<WidgetProps> = () => {
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
      const loop = 3200;
      const u = ((t - start) % loop) / loop;
      drawRiver(ctx, W, H, Math.sin(t / 400) * 2);
      drawDock(ctx, W - 48, H * 0.6);
      const x = 52 + u * (W - 128);
      drawBoat(ctx, x, H * 0.6, 0.95, COLORS.blue, COLORS.green);
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="漂移类比：船顺流到岸" />;
};

export default BoatAnalogy;
