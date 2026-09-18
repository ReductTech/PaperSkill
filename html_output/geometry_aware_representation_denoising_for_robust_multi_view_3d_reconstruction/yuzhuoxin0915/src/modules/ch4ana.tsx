import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 4 章类比卡：相纸在显影液中图像浮现（560x140）
const W = 560;
const H = 140;

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 显影盘
      ctx.fillStyle = '#76906a';
      ctx.fillRect(120, 80, 320, 40);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(130, 70, 300, 20);
      // 相纸
      const reveal = (Math.sin(t * 1.2) + 1) / 2; // 0..1 显影进度
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(170, 40, 220, 80);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(170, 40, 220, 80);
      // 图像随 reveal 浮现
      const opacity = reveal;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#27446e';
      ctx.fillRect(190, 55, 180, 10);
      ctx.fillRect(190, 70, 180, 6);
      ctx.fillRect(190, 85, 180, 6);
      ctx.beginPath();
      ctx.arc(280, 100, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('显影中', 400, 60);
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

export default Ch4Ana;
