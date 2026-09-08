import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana4: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 4;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
    drawWindow(ctx, 40, 15, 160, 90, C.blue);
    const gx = 60 + (t * 30) % 120, gy = 30 + (t * 20) % 50;
    drawDot(ctx, gx, gy, 4, C.orange);
    label(ctx, '[' + Math.floor((gx-40)/160*2000) + ',' + Math.floor((gy-15)/90*2000) + ']', 70, 118, C.blue, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default Ana4;
