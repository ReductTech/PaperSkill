import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaOverview: React.FC<WidgetProps> = () => {
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
    const terrain = (x: number) => 66 + Math.sin(x * 0.035) * 22 + Math.sin(x * 0.1) * 8;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // coarse overview (few big strokes, left half)
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 8]);
      ctx.beginPath();
      ctx.moveTo(48, 46);
      ctx.lineTo(48, 116);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(120, 40);
      ctx.lineTo(120, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(192, 46);
      ctx.lineTo(192, 114);
      ctx.stroke();
      ctx.setLineDash([]);

      // detailed map (fine strokes, right half) drawn progressively
      const sweep = ((t * 46) % 260) + 288;
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 288; x <= sweep; x += 4) {
        const y = terrain(x);
        if (x === 288) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // pen drawing the detail
      ctx.save();
      ctx.translate(sweep, terrain(sweep));
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

export default AnaOverview;
