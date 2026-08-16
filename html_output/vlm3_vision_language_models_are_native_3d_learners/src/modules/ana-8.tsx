import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana8: React.FC<WidgetProps> = () => {
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
    const st = Math.floor(t) % 3;
    const ns = ['统一', '文本', '配比'];
    ns.forEach((n, i) => {
      ctx.beginPath();
      ctx.fillStyle = i === st ? C.purple : '#fff';
      ctx.strokeStyle = C.purple;
      ctx.arc(50 + i * 70, 55, 22, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      label(ctx, n, 38 + i * 70, 59, i === st ? '#fff' : C.purple, 11);
      if (i < 2) { ctx.strokeStyle = C.border; ctx.beginPath(); ctx.moveTo(72 + i * 70, 55); ctx.lineTo(98 + i * 70, 55); ctx.stroke(); }
    });
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

export default Ana8;
