import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

/** 对比优化汗水（红）与零训练绿印章 */
export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const u = ((now - t0) % 3200) / 3200;
      const e = easeInOutQuad(u);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(24, 105, W - 48, 16);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(24, 105, W - 48, 16);

      // left: sweating optimize
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(70, 40, 50, 40);
      ctx.strokeRect(70, 40, 50, 40);
      for (let i = 0; i < 5; i++) {
        const drop = (e * 40 + i * 8) % 36;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(95 + Math.sin(i) * 12, 30 + drop);
        ctx.lineTo(95 + Math.sin(i) * 12, 36 + drop);
        ctx.stroke();
      }
      ctx.fillStyle = C.red;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('优化汗', 72, 98);

      // right: green stamp
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.fillRect(380, 40, 50, 40);
      ctx.strokeRect(380, 40, 50, 40);
      const stampY = 20 + e * 28;
      ctx.save();
      ctx.globalAlpha = 0.3 + e * 0.7;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(405, stampY + 20, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = C.green;
      ctx.textAlign = 'center';
      ctx.fillText('即用', 405, stampY + 24);
      ctx.restore();
      ctx.fillStyle = C.green;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('免训练', 382, 98);

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

export default Ana7;
