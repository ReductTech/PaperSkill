import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

// Chapter 1 analogy: a scanning beam sweeps across a desk and reveals
// object, depth/spatial, and actionability layers one by one.
const W = 244;
const H = 130;

export const AnalogyScene: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(18, 42, 208, 64);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(18, 42, 208, 64);
      // desk and objects
      ctx.fillStyle = C.route;
      ctx.fillRect(34, 88, 110, 12);
      ctx.fillStyle = '#f0c060';
      ctx.fillRect(60, 64, 20, 24);
      ctx.fillStyle = '#c96f3b';
      ctx.beginPath();
      ctx.arc(160, 78, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.light;
      ctx.fillRect(190, 58, 22, 30);
      // scanning beam
      const cycle = t % 4.0;
      const tt = cycle / 4.0;
      const x = 30 + tt * 196;
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.fillRect(22, 42, x - 22, 64);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 44);
      ctx.lineTo(x, 104);
      ctx.stroke();
      if (x >= 148) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(160, 78, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      label(ctx, '看 → 做 → 改', W / 2, 18, 11, C.blue);
    };
    const t0 = performance.now();
    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} aria-label="扫描光束类比动画" />;
};

export default AnalogyScene;
