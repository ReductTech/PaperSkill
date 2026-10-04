import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaLedger: React.FC<WidgetProps> = () => {
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

      // ledger: two columns
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, 150, 84);
      ctx.strokeRect(220, 30, 150, 84);

      // error bar (left, red) and ink bar (right, blue) oscillate inversely
      const k = (Math.sin(t * 1.4) + 1) / 2;
      const errH = 14 + k * 56;
      const inkH = 14 + (1 - k) * 56;
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(60, 104 - errH, 46, errH);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(240, 104 - inkH, 46, inkH);

      // pen writes a tick
      const penX = ((t * 60) % 200) + 40;
      ctx.save();
      ctx.translate(penX, 108);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-10, -3, 18, 5);
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(8, 3);
      ctx.lineTo(13, 0);
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

export default AnaLedger;
