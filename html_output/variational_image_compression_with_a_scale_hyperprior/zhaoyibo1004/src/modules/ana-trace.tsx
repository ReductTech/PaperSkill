import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaTrace: React.FC<WidgetProps> = () => {
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
    const ground = (x: number) => 96 + Math.sin(x * 0.025) * 18 + Math.sin(x * 0.06) * 6;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, ground(0));
      for (let x = 0; x <= W; x += 6) ctx.lineTo(x, ground(x));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      const px = ((t * 46) % 500) + 40;
      const py = ground(px);
      const dense = Math.sin(t * 1.6) > 0;

      ctx.strokeStyle = dense ? '#228d5c' : '#c43f52';
      ctx.lineWidth = dense ? 3 : 1.5;
      ctx.setLineDash(dense ? [] : [6, 4]);
      ctx.beginPath();
      for (let x = 40; x <= px; x += 4) {
        const y = ground(x);
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

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

export default AnaTrace;
