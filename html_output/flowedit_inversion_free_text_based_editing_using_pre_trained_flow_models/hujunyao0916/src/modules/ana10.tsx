import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

/** 两张照片赛跑：绿色更接近结构目标 */
export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let t0 = performance.now();

    const drawFrame = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, 36, 28);
      ctx.strokeRect(x, y, 36, 28);
      ctx.fillStyle = C.light;
      ctx.fillRect(x + 8, y + 6, 20, 14);
    };

    const tick = (now: number) => {
      const u = ((now - t0) % 3200) / 3200;
      const e = easeInOutQuad(Math.min(1, u / 0.75));
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // structure target
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(470, 40, 50, 60);
      ctx.setLineDash([]);
      ctx.fillStyle = C.text;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('结构', 478, 115);

      // lanes
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(40, 55);
      ctx.lineTo(460, 55);
      ctx.moveTo(40, 95);
      ctx.lineTo(460, 95);
      ctx.stroke();

      // red drifts away from structure (ends farther)
      const rx = lerp(40, 320, e);
      const ry = 40 + Math.sin(e * Math.PI * 3) * 8;
      drawFrame(ctx, rx, ry, C.red);

      // green finishes closer
      const gx = lerp(40, 430, e);
      drawFrame(ctx, gx, 82, C.green);

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('赛跑', 40, 28);
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

export default Ana10;
