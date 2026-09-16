import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', text: '#21324a',
};

function drawTable(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(30, 88, W - 60, 28);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 88, W - 60, 28);
}

function drawPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 2;
  ctx.fillRect(x - 24, y - 18, 48, 36);
  ctx.strokeRect(x - 24, y - 18, 48, 36);
  ctx.fillStyle = C.light;
  ctx.fillRect(x - 14, y - 8, 28, 18);
  ctx.restore();
}

function drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 28, y - 12, 56, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 4);
  ctx.restore();
}

/** 把源照片与两条提示标签放到灯箱上 */
export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const e = easeInOutQuad(Math.min(1, u / 0.7));
      drawTable(ctx);
      const px = lerp(60, 180, e);
      const py = lerp(40, 72, e);
      drawPhoto(ctx, px, py);
      const sTag = lerp(480, 300, e);
      const tTag = lerp(520, 380, Math.max(0, (e - 0.15) / 0.85));
      drawTag(ctx, sTag, 50, '源提示', C.blue, e);
      drawTag(ctx, tTag, 50, '目标提示', C.orange, Math.max(0, e - 0.1));
      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('摆料', 40, 28);
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

export default Ana2;
