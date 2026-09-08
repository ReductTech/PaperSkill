import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const BG = '#fffaf1', INK = '#222222', MUTED = '#666666', DARK = '#9933ff', BLUE = '#33ccff', ORANGE = '#ff3366';

// 类比：三个齿轮咬合系统。三齿轮同步转动，缺一不可。
export const Sec1Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const gear = (x: number, y: number, r: number, teeth: number, rot: number, color: string, label: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = ((i + 0.5) / teeth) * Math.PI * 2;
        ctx.lineTo(Math.cos(a0) * (r + 4), Math.sin(a0) * (r + 4));
        ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = BG;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = INK; ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      const spin = t / 900;
      gear(78, 54, 24, 9, spin, BLUE, 'MLLM');
      gear(150, 54, 20, 8, -spin * 1.2 + 0.2, DARK, 'VAE');
      gear(118, 96, 18, 7, spin * 1.3, ORANGE, 'MMDiT');
      ctx.fillStyle = MUTED; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('三齿轮咬合 · 协同驱动', W / 2, H - 8);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Sec1Ana;
