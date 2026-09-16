import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 1 章类比卡：一张照片在相机抖动下由清晰变模糊（560x140）
const W = 560;
const H = 140;

export const Ch1Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      // 背景
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 24, W, 24);
      // 相机（左侧静态道具）
      ctx.fillStyle = '#76906a';
      ctx.fillRect(60, 40, 70, 50);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(85, 30, 20, 12);
      // 照片主体（中间）
      const blur = (Math.sin(t * 2) + 1) / 2; // 0..1
      const photoX = 220;
      const photoY = 22;
      const photoW = 160;
      const photoH = 100;
      // 照片底
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(photoX, photoY, photoW, photoH);
      // 照片内容：一条水平线 + 一个圆点，模糊时抖动
      const jitter = blur * 6;
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const y = photoY + 30 + i * 22 + (Math.sin(t * 3 + i) * jitter);
        ctx.beginPath();
        ctx.moveTo(photoX + 20, y);
        ctx.lineTo(photoX + photoW - 20, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#27446e';
      const cx = photoX + photoW / 2 + Math.sin(t * 2.5) * jitter;
      ctx.beginPath();
      ctx.arc(cx, photoY + 60, 12 - blur * 4, 0, Math.PI * 2);
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

export default Ch1Ana;
