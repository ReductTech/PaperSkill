import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 对应画线 ↔ 位姿读成句子（与黄色框文案一致） */
export const Ana7: React.FC<WidgetProps> = () => {
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
      const phase = t < 2 ? 0 : 1; // 0 对应 / 1 位姿
      const pulse = (Math.sin(t * Math.PI) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      if (phase === 0) {
        // 像素对应：两窗 + 匹配线（垂直居中偏下，避开底角文字）
        drawWindow(ctx, 28, 26, 70, 68, C.blue);
        drawWindow(ctx, 146, 26, 70, 68, C.green);
        const ax = 52 + pulse * 8, ay = 56;
        const bx = 176 - pulse * 6, by = 62;
        drawDot(ctx, ax, ay, 4, C.orange);
        drawDot(ctx, bx, by, 4, C.green);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        label(ctx, '像素对应估计', 6, 124, C.muted, 10);
      } else {
        // 位姿：两视角 + 文本句子
        drawWindow(ctx, 20, 24, 58, 58, C.red);
        drawWindow(ctx, 88, 30, 58, 58, C.green);
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(56, 76);
        ctx.lineTo(106, 60);
        ctx.stroke();
        ctx.fillStyle = '#e8f7ef';
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.5;
        ctx.fillRect(158, 26, 72, 64);
        ctx.strokeRect(158, 26, 72, 64);
        label(ctx, 'Δt=0.8m', 166, 46, C.green, 10);
        label(ctx, 'yaw=12°', 166, 62, C.green, 10);
        label(ctx, 'pitch=-3°', 164, 78, C.green, 10);
        label(ctx, '位姿读成句子', 6, 124, C.muted, 10);
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

export default Ana7;
