import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaMark: React.FC<WidgetProps> = () => {
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
    const ground = (x: number) => 90 + Math.sin(x * 0.03) * 26;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // contour line
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 40; x <= 520; x += 4) {
        const y = ground(x);
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // dots cluster where the slope (detail) is high
      for (let x = 44; x <= 516; x += 8) {
        const slope = Math.abs(Math.cos(x * 0.03));
        const cluster = slope > 0.7;
        const phase = Math.sin(x * 1.7 + t * 3) * 0.5 + 0.5;
        if (cluster || phase > 0.82) {
          const y = ground(x) + (Math.sin(x * 7.3 + t * 2) - 0.5) * 16;
          ctx.fillStyle = '#f07e47';
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // pen nib
      const px = ((t * 40) % 480) + 40;
      ctx.save();
      ctx.translate(px, ground(px));
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

export default AnaMark;
