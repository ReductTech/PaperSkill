import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 物体级：文本 bbox，无额外编码器挂件 */
export const Ana5: React.FC<WidgetProps> = () => {
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
      const pulse = (Math.sin(t * 3) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawWindow(ctx, 20, 18, 110, 78, C.blue);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2 + pulse;
      ctx.strokeRect(42, 38, 55, 42);
      // 文本框数字条
      ctx.fillStyle = '#fff7ed';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.fillRect(145, 35, 80, 50);
      ctx.strokeRect(145, 35, 80, 50);
      label(ctx, '[x1,y1]', 158, 55, C.orange, 11);
      label(ctx, '[x2,y2]', 158, 72, C.orange, 11);
      label(ctx, '文本 bbox', 90, 118, C.text, 11);
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

export default Ana5;
