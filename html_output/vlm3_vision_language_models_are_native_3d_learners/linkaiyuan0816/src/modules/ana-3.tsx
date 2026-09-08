import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 焦距统一：不同窗框 → 同一把尺 f=1000 */
export const Ana3: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 3;
      const u = Math.min(1, t / 1.2);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      const w0 = 40 + 30 * (1 - u);
      const h0 = 32 + 22 * (1 - u);
      drawWindow(ctx, 18, 40, w0, h0, C.red);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, 70);
      ctx.lineTo(120, 70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(112, 64);
      ctx.lineTo(122, 70);
      ctx.lineTo(112, 76);
      ctx.stroke();
      drawWindow(ctx, 130, 36, 70, 55, C.green);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(130, 105);
      ctx.lineTo(200, 105);
      ctx.stroke();
      label(ctx, 'f=1000', 148, 118, C.green, 11);
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

export default Ana3;
