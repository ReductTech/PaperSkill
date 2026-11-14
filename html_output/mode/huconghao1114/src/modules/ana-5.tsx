import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, lamp, label, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 5: one shared preset board (blue and green windows leaking color into
// each other) is split by a hand into two independent boards with stable lamps.
const W = 560;
const H = 140;

export const Ana5: React.FC<WidgetProps> = () => {
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
      clearStudio(ctx, W, H, 0.9);
      const cycle = (now / 3200) % 1;
      const split = Math.min(1, cycle * 2.5); // 0 = together, 1 = split
      const cx = 280;
      const half = 62;
      const gap = split * 66;
      const flicker = split < 0.5 ? (Math.sin(now / 90) + 1) / 2 : 0;
      // left (answer) half board
      const lx = cx - half * 2 - gap / 2;
      board(ctx, lx, 34, half * 2, 72);
      ctx.fillStyle = mix(SC.blue, flicker > 0.5 ? SC.green : SC.bg, 0.15 + flicker * 0.2);
      ctx.fillRect(lx + 14, 52, 84, 36);
      lamp(ctx, lx + half * 2 - 16, 52, 7, split > 0.5, SC.blue);
      // right (generation) half board
      const rx = cx + gap / 2;
      board(ctx, rx, 34, half * 2, 72);
      ctx.fillStyle = mix(SC.green, flicker > 0.5 ? SC.blue : SC.bg, 0.15 + flicker * 0.2);
      ctx.fillRect(rx + 14, 52, 84, 36);
      lamp(ctx, rx + half * 2 - 16, 52, 7, split > 0.5, SC.green);
      // split seam
      ctx.strokeStyle = split > 0.5 ? SC.green : SC.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 26);
      ctx.lineTo(cx, 114);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, split > 0.5 ? '不相交' : '共用', cx, 128, split > 0.5 ? SC.green : SC.red, 12, 'center');
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
export default Ana5;
