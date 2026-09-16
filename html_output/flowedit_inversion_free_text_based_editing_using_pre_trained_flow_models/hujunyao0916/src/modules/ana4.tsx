import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  orange: '#f07e47', muted: '#68778f', text: '#21324a', border: '#d7deea',
};

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, dash = false) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = dash ? 1.5 : 3;
  if (dash) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 8 * Math.cos(ang - 0.4), y + dy - 8 * Math.sin(ang - 0.4));
  ctx.lineTo(x + dx - 8 * Math.cos(ang + 0.4), y + dy - 8 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

/** 橙色速度箭头平均多条灰色虚线箭头 */
export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const samples = [
      { dx: 90, dy: -28 },
      { dx: 110, dy: 18 },
      { dx: 70, dy: 32 },
      { dx: 100, dy: -10 },
      { dx: 85, dy: 5 },
    ];
    const avg = samples.reduce(
      (a, s) => ({ dx: a.dx + s.dx / samples.length, dy: a.dy + s.dy / samples.length }),
      { dx: 0, dy: 0 }
    );
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 2600) / 2600;
      const e = easeInOutQuad(u);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(24, 105, W - 48, 16);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(24, 105, W - 48, 16);

      // photo
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(80, 48, 44, 34);
      ctx.strokeRect(80, 48, 44, 34);

      const ox = 130;
      const oy = 65;
      samples.forEach((s, i) => {
        const show = e > i * 0.08;
        if (!show) return;
        arrow(ctx, ox, oy, s.dx * e, s.dy * e, C.muted, true);
      });
      if (e > 0.35) {
        const k = (e - 0.35) / 0.65;
        arrow(ctx, ox, oy, avg.dx * k, avg.dy * k, C.orange, false);
      }
      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('平均', 420, 40);
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

export default Ana4;
