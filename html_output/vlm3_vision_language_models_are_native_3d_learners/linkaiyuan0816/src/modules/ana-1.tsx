import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, label } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 类比：专家重仪器 ↔ VLM 吃力 ↔ 网格卡出路 */
export const Ana1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 6;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // 左：专家堆叠（抖动）
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#fde8eb';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        const y = 18 + i * 22 + Math.sin(t + i) * 1.5;
        ctx.fillRect(10, y, 58, 18);
        ctx.strokeRect(10, y, 58, 18);
      }
      label(ctx, '专家', 24, 95, C.red, 10);

      // 中：VLM 窗景但问号
      drawWindow(ctx, 85, 18, 60, 52, C.orange);
      label(ctx, '?', 108, 50, C.red, 18);
      label(ctx, 'VLM', 100, 95, C.orange, 10);

      // 右：网格卡出路
      const glow = (Math.sin(t * 2) + 1) / 2;
      drawWindow(ctx, 165, 14, 65, 56, C.green);
      drawGridCard(ctx, 178, 28, 38, 28, C.green);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1 + glow;
      ctx.strokeRect(165, 14, 65, 56);
      label(ctx, 'VLM3', 178, 95, C.green, 10);

      // 底部短说明：居中，不压在色带上
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(8, 108, W - 16, 18);
      ctx.strokeRect(8, 108, W - 16, 18);
      ctx.fillStyle = C.text;
      ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('强而重       →          轻而弱        →        简单并且高效', W / 2, 117);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
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

export default Ana1;
