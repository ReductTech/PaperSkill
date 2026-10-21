import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero two-panel contrast: old method = wide, mean-fixed-at-zero Gaussian (red);
// new method = narrow, learned-mean Gaussian (green). One component, branches on moduleId.

const W = 1080;
const H = 280;

function gaussian(ctx: CanvasRenderingContext2D, mu: number, sigma: number, color: string) {
  const baseY = H - 46;
  const amp = 190;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 4) {
    const y = baseY - amp * Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export const HeroSide: React.FC<WidgetProps> = ({ moduleId }) => {
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
    const isNew = moduleId === 'new';
    const color = isNew ? '#228d5c' : '#c43f52';
    const sigma = isNew ? 90 : 260;
    const mu = isNew ? W * 0.62 : W * 0.5;
    const label = isNew ? 'μ 可学' : 'μ=0';

    const render = (t: number) => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, H - 46);
      ctx.lineTo(W - 16, H - 46);
      ctx.stroke();
      const breath = 1 + 0.05 * Math.sin(t * 0.002);
      gaussian(ctx, mu, sigma / breath, color);
      ctx.strokeStyle = color;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(mu, H - 46);
      ctx.lineTo(mu, H - 232);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(label, 24, 36);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return <canvas id={`cv-hero-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroSide;
