import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 左：DINO —— 认得出“这是什么”，却看不清轮廓在哪
const W = 460;
const H = 240;

export const HeroOld: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const t0 = performance.now();
    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 天空与地面（语义色块）
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 0, W, 150);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 150, W, 90);

      // 一只简化的“狗/几何物体”（色块语义，轮廓模糊）
      const cx = 200;
      const cy = 140;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - 60, cy - 30, 120, 60);
      ctx.beginPath();
      ctx.arc(cx + 70, cy - 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy - 20);
      ctx.lineTo(cx - 95, cy - 45);
      ctx.lineTo(cx - 62, cy - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 45, cy + 30, 18, 26);
      ctx.fillRect(cx - 5, cy + 30, 18, 26);

      // 轮廓缺失（红色虚线）
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      const jitter = Math.sin((t - t0) / 700) * 2;
      ctx.strokeRect(cx - 60 + jitter, cy - 30, 120, 60);
      ctx.setLineDash([]);

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('“这是一条狗” ✓', 40, 40);
      ctx.fillStyle = '#c43f52';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('轮廓在哪？ ✗', 40, 64);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('DINO · 语义强 / 结构弱', 40, H - 14);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
