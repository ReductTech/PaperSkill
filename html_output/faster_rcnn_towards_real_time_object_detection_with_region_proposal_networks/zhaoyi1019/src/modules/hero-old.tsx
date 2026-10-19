import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 480;
const H = 280;

const SKY = '#0b1830';
const GLOW = '#122346';
const STAR_DIM = '#7f8db0';
const STAR = '#dfe7f5';
const RED = '#c43f52';

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
    const start0 = performance.now();
    const render = (now: number) => {
      const t = ((now - start0) % 3600) / 3600;
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = STAR_DIM;
      for (const [x, y] of [[50, 50], [130, 130], [220, 60], [300, 170], [390, 90], [440, 190]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      const by = t * (H + 160) - 80;
      const grad = ctx.createLinearGradient(0, by - 55, 0, by + 55);
      grad.addColorStop(0, 'rgba(196,63,82,0)');
      grad.addColorStop(0.5, 'rgba(196,63,82,0.45)');
      grad.addColorStop(1, 'rgba(196,63,82,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, by - 55, W, 110);
      const fx = 240;
      const fy = 200;
      const framed = by > fy - 20;
      ctx.strokeStyle = framed ? RED : 'rgba(196,63,82,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx - 22, fy - 22, 44, 44);
      ctx.fillStyle = framed ? RED : STAR_DIM;
      ctx.beginPath();
      ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '24px "Segoe UI", sans-serif';
      ctx.fillText('2.0 s', 18, 36);
      ctx.fillStyle = STAR_DIM;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('外部提案 · 慢', 18, 60);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
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

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
