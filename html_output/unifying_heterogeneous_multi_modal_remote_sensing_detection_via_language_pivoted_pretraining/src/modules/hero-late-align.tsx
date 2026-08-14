import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero side: late alignment — a tutor's pen bounces between three books
// and leaves a red ink blot. Continuous ambient loop.

const W = 360;
const H = 200;

export const HeroLateAlign: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawBook = (x: number, y: number, color: string, label: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 38, y - 28, 76, 56);
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 38, y - 28, 76, 56);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    };

    const render = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      // quiet field
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // desk band
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 60, W, 60);
      // desk grain
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30);
      ctx.stroke();

      // three books jitter on the desk
      const jitter = Math.sin(elapsed * 5) * 2;
      drawBook(80 + jitter, H - 60, '#c43f52', 'RGB');
      drawBook(180, H - 60 - jitter, '#228d5c', 'SAR');
      drawBook(280 - jitter, H - 60, '#7c3aed', 'IR');

      // tutor's pen — chaotic bounce between three books
      const targetX = 80 + 100 * ((elapsed * 1.7) % 1);
      const targetY = H - 80;
      const px = 60 + (targetX - 60) * 0.6 + Math.sin(elapsed * 9) * 12;
      const py = 30 + Math.sin(elapsed * 11) * 18;

      // pen body
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(elapsed * 7) * 0.4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-3, -22, 6, 26);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(-3, 4, 6, 6);
      ctx.restore();

      // red ink blot at the pen tip
      const inkSize = 6 + Math.sin(elapsed * 4) * 2;
      ctx.fillStyle = 'rgba(196, 63, 82, 0.7)';
      ctx.beginPath();
      ctx.arc(px, py + 14, inkSize, 0, Math.PI * 2);
      ctx.fill();

      // red splatters on the desk
      ctx.fillStyle = 'rgba(196, 63, 82, 0.35)';
      for (let i = 0; i < 4; i++) {
        const sx = 40 + (i * 70) + Math.sin(elapsed * 2 + i) * 6;
        const sy = H - 20 + Math.cos(elapsed * 3 + i) * 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 4 + i * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => {
      startRef.current = performance.now();
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} aria-label="晚期对齐示意图" />;
};

export default HeroLateAlign;
