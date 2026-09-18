import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', orange: '#f07e47', text: '#21324a', muted: '#68778f',
};

/** 像光圈环一样拨动 n_max */
export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const tick = (now: number) => {
      const u = ((now - t0) % 3400) / 3400;
      const e = easeInOutQuad(u);
      const nMax = lerp(10, 45, e);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(24, 105, W - 48, 16);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(24, 105, W - 48, 16);

      // photo with aperture ring
      const cx = 220;
      const cy = 62;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 40, cy - 30, 80, 60);
      ctx.strokeRect(cx - 40, cy - 30, 80, 60);

      const ang = e * Math.PI * 1.6;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + ang);
      ctx.stroke();
      // dial mark
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang - Math.PI / 2) * 22, cy + Math.sin(ang - Math.PI / 2) * 22, 4, 0, Math.PI * 2);
      ctx.fill();

      // strength bar
      ctx.fillStyle = C.muted;
      ctx.fillRect(340, 50, 160, 10);
      ctx.fillStyle = C.orange;
      ctx.fillRect(340, 50, 160 * (nMax / 50), 10);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('光圈', 40, 28);
      ctx.fillText('nₘₐₓ≈' + nMax.toFixed(0), 340, 40);

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

export default Ana9;
