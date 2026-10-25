import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 300;
const GROUPS = [2, 2, 4, 8, 16]; // relative widths 16/16/32/64/M-128

// Hero "new method": ELIC uneven grouping — 5 groups fill in parallel.
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
    const t0 = performance.now();

    const render = () => {
      const now = performance.now();
      const cycle = ((now - t0) % 3200) / 3200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const total = GROUPS.reduce((a, b) => a + b, 0);
      const gap = 8;
      const areaW = W - 80;
      let cx = 40;
      const y = H / 2 - 18;
      const fill = clamp(cycle * 2.4 - 0.4, 0, 1);
      for (const g of GROUPS) {
        const gw = (g / total) * (areaW - gap * (GROUPS.length - 1));
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(cx, y, gw, 36);
        const fh = 36 * fill;
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(cx, y + 36 - fh, gw, fh);
        cx += gw + gap;
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('并行', 40, H - 22);
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

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
