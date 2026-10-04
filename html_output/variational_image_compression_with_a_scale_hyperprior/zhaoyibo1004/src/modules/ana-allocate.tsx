import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaAllocate: React.FC<WidgetProps> = () => {
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
    const ground = (x: number) => 88 + Math.sin(x * 0.028) * 20;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 40; x <= 520; x += 4) {
        const y = ground(x);
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ink dots distributed by local slope (detail) — dense where steep
      const sweep = ((t * 52) % 480) + 40;
      for (let x = 40; x <= sweep; x += 1) {
        const slope = Math.abs(Math.cos(x * 0.028));
        const spacing = 10 - slope * 7;
        if (Math.floor(x) % Math.max(2, Math.round(spacing)) === 0) {
          const y = ground(x) + (Math.sin(x * 9.1) - 0.5) * 12;
          ctx.fillStyle = '#27446e';
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(sweep, ground(sweep));
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-12, -3, 20, 6);
      ctx.fillStyle = '#f07e47';
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

export default AnaAllocate;
