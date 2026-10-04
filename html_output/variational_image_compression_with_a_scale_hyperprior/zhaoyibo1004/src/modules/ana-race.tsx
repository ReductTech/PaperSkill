import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnaRace: React.FC<WidgetProps> = () => {
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

      // two tracks
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 56);
      ctx.lineTo(500, 56);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, 96);
      ctx.lineTo(500, 96);
      ctx.stroke();

      // goal flag
      ctx.fillStyle = '#92400e';
      ctx.fillRect(500, 40, 4, 66);
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.moveTo(504, 40);
      ctx.lineTo(536, 48);
      ctx.lineTo(504, 56);
      ctx.closePath();
      ctx.fill();

      // old (red, slower) vs new (green, faster) — new wins each lap
      const lap = t % 6;
      const newX = 40 + Math.min(1, lap / 3.2) * 440;
      const oldX = 40 + Math.min(1, lap / 4.6) * 440;

      const drawPen = (x: number, y: number, body: string, nib: string) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = body;
        ctx.fillRect(-12, -3, 20, 6);
        ctx.fillStyle = nib;
        ctx.beginPath();
        ctx.moveTo(8, -3);
        ctx.lineTo(8, 3);
        ctx.lineTo(15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawPen(newX, 56, '#92400e', '#228d5c');
      drawPen(oldX, 96, '#92400e', '#c43f52');

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

export default AnaRace;
