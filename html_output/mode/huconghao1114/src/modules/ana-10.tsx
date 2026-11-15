import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, stampMark, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 10: the year-end review — a stamp lands on each of five albums in
// turn (grey), and the MoDE album gets a big green pass stamp.
const W = 560;
const H = 140;
const ALBUMS = ['SeqLoRA', 'ModelTailor', 'DualPrompt', 'CL-MoE', 'MoDE'];

export const Ana10: React.FC<WidgetProps> = () => {
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
      // review desk
      ctx.fillStyle = SC.ground;
      ctx.fillRect(0, 112, W, 28);
      const t = (now / 3000) % 1;
      const stampIdx = Math.min(4, Math.floor(t * 5));
      ALBUMS.forEach((name, i) => {
        const x = 40 + i * 104;
        const isMoDE = i === 4;
        // album standing
        ctx.fillStyle = isMoDE ? mix(SC.handle, SC.paper, 0.25) : SC.handle;
        ctx.fillRect(x, 40, 76, 72);
        ctx.fillStyle = SC.paper;
        ctx.fillRect(x + 6, 46, 64, 42);
        ctx.fillStyle = isMoDE ? SC.green : SC.shade;
        ctx.fillRect(x + 10, 52, 56, 22);
        // stamp
        const landed = i < stampIdx || (i === stampIdx && t * 5 - stampIdx > 0.5);
        if (landed) {
          stampMark(ctx, x + 38, 76, 20, isMoDE ? SC.green : SC.muted);
        } else if (i === stampIdx) {
          // stamp descending
          const drop = (t * 5 - stampIdx) / 0.5;
          ctx.globalAlpha = drop;
          stampMark(ctx, x + 38, 40 + drop * 36, 20, SC.muted);
          ctx.globalAlpha = 1;
        }
      });
      label(ctx, '评审章逐本落下', 280, 132, SC.muted, 11, 'center');
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
export default Ana10;
