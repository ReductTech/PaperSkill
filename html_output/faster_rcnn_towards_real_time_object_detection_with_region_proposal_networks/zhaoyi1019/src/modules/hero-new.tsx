import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 480;
const H = 280;

const SKY = '#0b1830';
const GLOW = '#122346';
const STAR = '#dfe7f5';
const STAR_DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const TUBE = '#8a97b8';
const TUBE_DARK = '#5c6b8f';
const SUPPORT = '#92400e';

export const HeroNew: React.FC<WidgetProps> = () => {
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
      const t = ((now - start0) % 3000) / 3000;
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = STAR_DIM;
      for (const [x, y] of [[50, 60], [120, 170], [210, 70], [310, 180], [400, 100], [440, 190]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // shared starlight ray
      const sx = 140;
      const sy = 58;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(180, 150);
      ctx.moveTo(sx, sy);
      ctx.lineTo(240, 160);
      ctx.stroke();
      // telescope (tripod + tube pointing up-right)
      ctx.strokeStyle = TUBE_DARK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(180, H - 60);
      ctx.lineTo(210, 190);
      ctx.moveTo(310, H - 60);
      ctx.lineTo(250, 190);
      ctx.stroke();
      ctx.save();
      ctx.translate(230, 185);
      ctx.rotate(-0.35);
      ctx.fillStyle = TUBE;
      ctx.fillRect(-58, -12, 116, 24);
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(-82, -8, 26, 16);
      ctx.restore();
      // finder scope + eyepiece
      ctx.fillStyle = SUPPORT;
      ctx.fillRect(180, 142, 44, 9);
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(236, 158, 28, 15);
      // framed star (green)
      const fx = 370;
      const fy = 92;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.strokeRect(fx - 24, fy - 24, 48, 48);
      ctx.fillStyle = STAR;
      ctx.beginPath();
      ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      ctx.fill();
      // proposal bar + label
      ctx.fillStyle = GREEN;
      ctx.fillRect(18, H - 46, 70 + Math.sin(t * Math.PI) * 6, 12);
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText('10 ms', 18, 34);
      ctx.fillStyle = STAR_DIM;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('共享星光 · 提案', 18, 58);
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

export default HeroNew;
