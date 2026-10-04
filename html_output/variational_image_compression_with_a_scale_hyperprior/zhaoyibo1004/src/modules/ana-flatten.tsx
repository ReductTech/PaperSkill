import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaFlatten: React.FC<WidgetProps> = () => {
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
    const bump = (x: number) => 46 + Math.sin(x * 0.03) * 20 + Math.sin(x * 0.09) * 8;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // bumpy terrain (top)
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 40; x <= 520; x += 4) {
        const y = bump(x);
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // flattened sketch (bottom) drawn as the pen sweeps
      const px = ((t * 44) % 480) + 40;
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 104);
      ctx.lineTo(px, 104);
      ctx.stroke();

      // pen linking the two
      ctx.save();
      ctx.translate(px, 104);
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

export default AnaFlatten;
