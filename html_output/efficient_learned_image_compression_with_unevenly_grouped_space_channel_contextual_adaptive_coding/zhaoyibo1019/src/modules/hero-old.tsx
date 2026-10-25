import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 300;
const COLS = 12;

// Hero "old method": serial autoregressive decoding — symbols light up one by one.
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

    const render = () => {
      const now = performance.now();
      const cycle = ((now - t0) % 4200) / 4200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gap = 12;
      const sw = (W - 80 - (COLS - 1) * gap) / COLS;
      const y = H / 2 - sw / 2;
      const head = Math.floor(cycle * (COLS + 6)) - 5;
      for (let i = 0; i < COLS; i++) {
        const x = 40 + i * (sw + gap);
        const on = i <= head;
        ctx.fillStyle = on ? '#c43f52' : '#d7deea';
        ctx.fillRect(x, y, sw, sw);
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('串行', 40, H - 22);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
  }, []);

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
