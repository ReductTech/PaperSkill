import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, slip, filmChip, lamp, label, lockTag, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 6: one interleaved film holder drops onto a dual-slot tray; chips fall
// into the image slot and slips into the text slot while the backbone stays locked.
const W = 560;
const H = 140;

export const Ana6: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (now: number) => {
      clearStudio(ctx, W, H, 0.92);
      const cycle = (now / 3000) % 1;
      const e = 1 - Math.pow(1 - Math.min(1, cycle * 1.8), 3);
      // backbone band with lock tag
      ctx.fillStyle = SC.shade;
      ctx.fillRect(0, 16, W, 22);
      lockTag(ctx, 20, 18);
      // incoming mixed holder (slides down/right)
      const hx = 20 + e * 40;
      const hy = 44 + e * 10;
      ctx.strokeStyle = mix(SC.blue, SC.bg, 0.3);
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, 150, 54);
      for (let i = 0; i < 6; i++) {
        const x = hx + 8 + i * 24;
        if (i % 2 === 0) filmChip(ctx, x, hy + 12, 18, SC.green);
        else slip(ctx, x, hy + 6, 18, 30);
      }
      // dual slots
      const sy = 96;
      slip(ctx, 250 + e * 60, sy, 130, 28, SC.blue);
      label(ctx, '答题槽', 315 + e * 60, sy + 22, SC.muted, 9, 'center');
      filmChip(ctx, 250 + e * 60, sy + 32, 18, SC.green);
      label(ctx, '出图槽', 315 + e * 60, sy + 44, SC.muted, 9, 'center');
      lamp(ctx, 430, sy + 14, 8, e > 0.7, SC.blue);
      lamp(ctx, 430, sy + 40, 8, e > 0.7, SC.green);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default Ana6;
