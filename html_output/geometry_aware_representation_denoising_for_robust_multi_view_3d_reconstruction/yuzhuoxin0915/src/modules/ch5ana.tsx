import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 5 章类比卡：手电光束扫过底片照亮对应区域（560x140）
const W = 560;
const H = 140;

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 底片
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(120, 30, 320, 90);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 30, 320, 90);
      // 底片上的网格点（对应区域候选）
      ctx.fillStyle = '#b8c9a7';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(150 + i * 65, 75, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      // 手电光束，扫到关键区域（t 控制位置）
      const bx = 150 + ((Math.sin(t * 1.5) + 1) / 2) * 260;
      const grad = ctx.createRadialGradient(bx, 75, 5, bx, 75, 60);
      grad.addColorStop(0, 'rgba(240, 126, 71, 0.7)');
      grad.addColorStop(1, 'rgba(240, 126, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, 75, 60, 0, Math.PI * 2);
      ctx.fill();
      // 照亮的关键点
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(bx, 75, 8, 0, Math.PI * 2);
      ctx.fill();
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

export default Ch5Ana;
