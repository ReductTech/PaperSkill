import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', text: '#21324a', border: '#d7deea',
};

function drawTable(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(20, 100, W - 40, 18);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 100, W - 40, 18);
}

function drawPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 2;
  ctx.fillRect(-22, -16, 44, 32);
  ctx.strokeRect(-22, -16, 44, 32);
  ctx.fillStyle = C.light;
  ctx.fillRect(-14, -8, 28, 16);
  ctx.restore();
}

/** 照片绕远红路 vs 短绿直路 */
export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const sx = 70;
    const sy = 70;
    const tx = 490;
    const ty = 70;
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 3200) / 3200;
      const e = easeInOutQuad(u < 0.85 ? u / 0.85 : 1);
      drawTable(ctx);
      // green short path
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // red noisy detour
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= 24; i++) {
        const p = i / 24;
        const x = lerp(sx, tx, p);
        const y = sy - Math.sin(p * Math.PI) * 48 - Math.sin(p * 10) * 6;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // photo on red path
      const px = lerp(sx, tx, e);
      const py = sy - Math.sin(e * Math.PI) * 48 - Math.sin(e * 10) * 6;
      drawPhoto(ctx, px, py, Math.sin(e * 6) * 0.08);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('绕远', 200, 28);
      ctx.fillText('直达', 250, 92);
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

export default Ana1;
