import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 2 章类比卡：多张底片在灯箱上叠放对齐（560x140）
const W = 560;
const H = 140;

export const Ch2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // 灯箱
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(150, 70, 260, 40);
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(160, 60, 240, 30);
      // 三张底片叠放，随 t 对齐
      const offset = Math.sin(t * 1.5) * 6;
      const colors = ['#27446e', '#228d5c', '#f07e47'];
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        const x = 180 + i * 8 - offset * (i === 1 ? 1 : 0);
        const y = 50 + i * 4;
        ctx.strokeRect(x, y, 200, 70);
        // 底片内一条线
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 35);
        ctx.lineTo(x + 180, y + 35);
        ctx.stroke();
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('叠放对齐', 180, 130);
    };

    const tick = (time: number) => {
      render(time / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch2Ana;
