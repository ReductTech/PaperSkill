import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', purple: '#7c3aed', text: '#21324a', border: '#d7deea',
};

/** 翻开照片露出内部平行四边形构造 */
export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const u = ((now - t0) % 3000) / 3000;
      const e = easeInOutQuad(u < 0.7 ? u / 0.7 : 1);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(30, 108, W - 60, 14);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(30, 108, W - 60, 14);

      const cx = 280;
      const cy = 70;
      // left panel (cover)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      const open = e * 0.9;
      // right half fixed
      ctx.fillRect(0, -40, 70, 80);
      ctx.strokeRect(0, -40, 70, 80);
      // left half opens
      ctx.save();
      ctx.transform(Math.cos(open), 0, 0, 1, -70 * Math.cos(open), 0);
      ctx.fillStyle = C.light;
      ctx.fillRect(0, -40, 70, 80);
      ctx.strokeStyle = C.brown;
      ctx.strokeRect(0, -40, 70, 80);
      ctx.restore();

      // parallelogram inside
      if (e > 0.25) {
        const a = (e - 0.25) / 0.75;
        ctx.globalAlpha = a;
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 20);
        ctx.lineTo(28, -22);
        ctx.lineTo(58, -22);
        ctx.lineTo(38, 20);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(8, 20);
        ctx.lineTo(38, 20);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('揭开', 40, 28);
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

export default Ana8;
