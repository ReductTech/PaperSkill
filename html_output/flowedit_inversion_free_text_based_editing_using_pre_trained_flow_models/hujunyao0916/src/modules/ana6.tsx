import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', text: '#21324a', border: '#d7deea',
};

/** 照片沿短绿路径逐步推进（推理） */
export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const steps = 6;
    const sx = 70;
    const sy = 70;
    const tx = 480;
    const ty = 70;
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 3600) / 3600;
      const stepF = u * steps;
      const step = Math.min(steps, Math.floor(stepF));
      const frac = easeInOutQuad(stepF - Math.floor(stepF));
      const i0 = Math.min(step, steps - 1);
      const i1 = Math.min(step + 1, steps);
      const p0 = i0 / steps;
      const p1 = i1 / steps;
      const p = lerp(p0, p1, step >= steps ? 1 : frac);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(20, 100, W - 40, 18);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(20, 100, W - 40, 18);

      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      for (let i = 0; i <= steps; i++) {
        const x = lerp(sx, tx, i / steps);
        ctx.fillStyle = i <= step ? C.green : C.border;
        ctx.beginPath();
        ctx.arc(x, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const px = lerp(sx, tx, p);
      const py = lerp(sy, ty, p);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 20, py - 15, 40, 30);
      ctx.strokeRect(px - 20, py - 15, 40, 30);
      ctx.fillStyle = C.light;
      ctx.fillRect(px - 10, py - 6, 20, 14);

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('步进', 40, 28);
      canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const start = () => {
      if (!raf.current) {
        t0 = performance.now();
        raf.current = requestAnimationFrame(tick);
      }
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ana6;
