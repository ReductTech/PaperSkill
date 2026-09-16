import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', purple: '#7c3aed', text: '#21324a', border: '#d7deea',
};

/** 在灯箱上画出平行四边形捷径 */
export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const A = { x: 90, y: 95 };
    const B = { x: 220, y: 35 };
    const Cpt = { x: 470, y: 35 };
    const D = { x: 340, y: 95 };
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 2800) / 2800;
      const e = easeInOutQuad(u);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(40, 110, W - 80, 16);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(40, 110, W - 80, 16);

      // base edges
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(Cpt.x, Cpt.y);
      ctx.lineTo(D.x, D.y);
      ctx.closePath();
      ctx.stroke();

      // diagonal shortcut grows
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(A.x + (D.x - A.x) * e, A.y + (D.y - A.y) * e);
      ctx.stroke();

      // purple construction
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(B.x, B.y);
      ctx.lineTo(B.x + (Cpt.x - B.x) * e, B.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const pts = [
        [A, C.brown],
        [B, C.blue],
        [Cpt, C.blue],
        [D, C.green],
      ] as const;
      for (const [p, col] of pts) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // photo at A sliding toward D
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      const px = A.x + (D.x - A.x) * e - 18;
      const py = A.y + (D.y - A.y) * e - 22;
      ctx.fillRect(px, py, 36, 28);
      ctx.strokeRect(px, py, 36, 28);

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('捷径', 250, 78);
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

export default Ana3;
