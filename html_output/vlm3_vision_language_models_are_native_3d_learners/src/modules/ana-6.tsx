import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 合并：深度点问距 + 物体文本框 */
export const Ana6: React.FC<WidgetProps> = () => {
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
      const phase = t < 2 ? 0 : 1; // 0 深度 / 1 物体
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawWindow(ctx, 18, 22, 100, 82, C.blue);

      if (phase === 0) {
        drawDot(ctx, 58, 60, 5, C.orange);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(70, 34);
        ctx.lineTo(58, 60);
        ctx.stroke();
        ctx.fillStyle = '#e8f0fa';
        ctx.strokeStyle = C.blue;
        ctx.fillRect(130, 32, 96, 58);
        ctx.strokeRect(130, 32, 96, 58);
        label(ctx, 'depth', 152, 54, C.blue, 12);
        label(ctx, '≈ 4.6 m', 148, 72, C.text, 11);
        // 说明移至左下角
        label(ctx, '度量深度', 6, 124, C.muted, 10);
      } else {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(38, 40, 52, 42);
        ctx.fillStyle = '#fff7ed';
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.5;
        ctx.fillRect(130, 32, 96, 58);
        ctx.strokeRect(130, 32, 96, 58);
        label(ctx, '[x1,y1]', 148, 54, C.orange, 11);
        label(ctx, '[x2,y2]', 148, 72, C.orange, 11);
        label(ctx, '物体 bbox', 6, 124, C.muted, 10);
      }

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

export default Ana6;
