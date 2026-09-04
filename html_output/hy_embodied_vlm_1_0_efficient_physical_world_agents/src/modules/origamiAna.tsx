import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 244;
const H = 130;

function drawSheet(ctx: CanvasRenderingContext2D, left: number, top: number, size: number, fold: number): void {
  const crease = left + size / 2;
  // left half
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(crease, top);
  ctx.lineTo(crease, top + size);
  ctx.lineTo(left, top + size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // folded right half projection
  const rightX = left + size - (left + size - crease) * fold;
  ctx.fillStyle = fold > 0.03 ? '#dbeafe' : '#ffffff';
  ctx.globalAlpha = 0.65 + 0.35 * fold;
  ctx.beginPath();
  ctx.moveTo(crease, top);
  ctx.lineTo(rightX, top);
  ctx.lineTo(rightX, top + size);
  ctx.lineTo(crease, top + size);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.orange;
  ctx.stroke();
  ctx.globalAlpha = 1;
  // predicted crease
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(crease, top - 6);
  ctx.lineTo(crease, top + size + 6);
  ctx.stroke();
  ctx.setLineDash([]);
}

export const OrigamiAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const cycle = t % 4.4;
      let fold = 0;
      let title = '先看懂折痕';
      let color = C.blue;
      if (cycle < 1.1) {
        fold = 0;
        title = '先看懂折痕与几何';
      } else if (cycle < 2.2) {
        fold = Math.min(1, (cycle - 1.1) / 0.9);
        title = '折一下，形状改变';
        color = C.orange;
      } else if (cycle < 2.9) {
        fold = 1;
        title = '动作造成了新状态';
        color = C.green;
      } else {
        fold = Math.max(0, 1 - (cycle - 2.9) / 1.1);
        title = '展开，准备下一步';
        color = C.blue;
      }
      drawSheet(ctx, 62, 22, 100, fold);
      label(ctx, title, W / 2, 14, 10, color);
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
  return <canvas ref={ref} width={W} height={H} aria-label="折纸类比动画" />;
};

export default OrigamiAna;
