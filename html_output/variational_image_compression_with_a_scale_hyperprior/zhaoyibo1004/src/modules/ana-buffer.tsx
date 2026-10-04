import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaBuffer: React.FC<WidgetProps> = () => {
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

      // jagged density dots (top)
      for (let x = 48; x <= 512; x += 10) {
        const jag = 38 + ((x * 7.3) % 60);
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(x, jag, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // smoothed curve (bottom) formed progressively
      const sweep = ((t * 50) % 470) + 46;
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 46; x <= sweep; x += 4) {
        const y = 100 + Math.sin(x * 0.05) * 14;
        if (x === 46) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // pen smoothing downward
      ctx.save();
      ctx.translate(sweep, 100 + Math.sin(sweep * 0.05) * 14);
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

export default AnaBuffer;
