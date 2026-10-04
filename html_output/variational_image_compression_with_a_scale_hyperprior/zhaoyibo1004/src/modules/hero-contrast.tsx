import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 440;
const H = 220;

export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // terrain silhouette
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, H - 52);
      for (let x = 0; x <= W; x += 8) {
        const y = H - 52 - Math.sin((x - W / 2) * 0.013) * 34 - Math.sin(x * 0.035) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // contour lines: adaptive (new) clusters near peak, uniform (old) spreads evenly
      const cx = W / 2;
      const cy = H - 78;
      const adaptive = moduleId === 'new';
      const color = adaptive ? '#228d5c' : '#c43f52';
      const radii = adaptive ? [0.10, 0.20, 0.33, 0.52, 0.76] : [0.17, 0.34, 0.51, 0.68, 0.85];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < radii.length; i += 1) {
        const r = radii[i];
        ctx.beginPath();
        ctx.ellipse(cx, cy, 34 + r * 158, 13 + r * 42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // sweeping pen dot
      const px = ((t * 30) % (W - 90)) + 45;
      const py = cy + Math.sin(px * 0.04 + t) * 12;
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const begin = () => {
      if (!raf.current) raf.current = requestAnimationFrame(render);
    };
    const dc = observeCanvas(c, begin, stop);
    begin();
    return () => {
      stop();
      dc();
    };
  }, [moduleId]);

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroContrast;
