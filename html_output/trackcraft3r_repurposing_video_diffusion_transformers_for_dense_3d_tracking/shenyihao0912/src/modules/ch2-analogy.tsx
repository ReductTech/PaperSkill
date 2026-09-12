import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawCamcorder, drawTimeCard } from './dogKit';
import type { WidgetProps } from './registry';

// Ch2 analogy card: half-pressed shutter — focus brackets converge on the dog
// while an orange distance tag counts 1.0 -> 10.0 m and back in a loop.
const W = 560;
const H = 140;
const LOOP = 3200;

export const Ch2Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const dogX = W * 0.6;
    const groundY = H - 32;
    const nose = { x: dogX + 24, y: groundY - 26 };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawDog(ctx, dogX, groundY, 1.05, { mood: 'idle', t });
      drawTracker(ctx, nose.x, nose.y, 3);
      drawCamcorder(ctx, 46, H - 16, { scale: 1.1 });
      // focus brackets converge on the dog as the half-press measures distance
      const conv = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      const size = 62 - 36 * conv;
      const b = 9;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      const cs: [number, number][] = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      cs.forEach(([sx, sy]) => {
        const px = nose.x + sx * size;
        const py = nose.y + sy * size;
        ctx.beginPath();
        ctx.moveTo(px - sx * b, py);
        ctx.lineTo(px, py);
        ctx.lineTo(px, py - sy * b);
        ctx.stroke();
      });
      // orange distance tag: 1.0 -> 10.0 m and back
      const d = 1 + 9 * conv;
      drawTimeCard(ctx, nose.x + 78, 30, `${d.toFixed(1)} m`);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch2Analogy;
