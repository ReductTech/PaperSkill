import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaPractice: React.FC<WidgetProps> = () => {
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
    const target = (x: number) => 72 + Math.sin(x * 0.03) * 22;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // dashed target
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let x = 40; x <= 520; x += 4) {
        const y = target(x);
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // wobble shrinks with practice
      const wobble = Math.max(2, 15 * Math.exp(-t * 0.18));
      const px = ((t * 50) % 480) + 40;
      const py = target(px) + Math.sin(t * 7) * wobble;

      // steady trace (green)
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 40; x <= px; x += 4) {
        const y = target(x) + Math.sin(x * 0.25 + t * 7) * wobble;
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-12, -3, 20, 6);
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(8, 3);
      ctx.lineTo(15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

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
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default AnaPractice;
