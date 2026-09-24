import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawOrderCard, drawMenuBoard, drawCrossMark } from './chefKit';
import type { WidgetProps } from './registry';

// Analogy card §1: the old employee works off a button menu board; a customer
// hands in a hand-written off-menu order — he scans the board, finds no match,
// and shakes his head (red cross). Auto-looping 560x140 scene.
const W = 560;
const H = 140;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const p = (ms % 3000) / 3000;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // static prop: the red button menu board (closed set)
      drawMenuBoard(ctx, 452, 74);
      // the old employee (red apron)
      const rejecting = p > 0.78;
      drawChef(ctx, 336, 106, 1, {
        mode: rejecting ? 'shake' : 'read',
        t: p * 3,
        chefColor: C.red,
      });
      // moving subject: the off-menu order card slides in from the left
      const slide = easeOutCubic(clamp(p / 0.24, 0, 1));
      drawOrderCard(ctx, -50 + slide * 205, 62, '菜单外');
      // he scans every button on the board — nothing matches
      if (p >= 0.42 && p < 0.78) {
        const scan = clamp((p - 0.42) / 0.36, 0, 1);
        const cell = Math.floor(scan * 12);
        const col = cell % 3;
        const row = Math.floor(cell / 3);
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(452 - 26 + col * 19, 74 - 26 + row * 15, 15, 11, 2);
        ctx.stroke();
        ctx.restore();
      }
      // rejection: red cross over the board
      if (rejecting) drawCrossMark(ctx, 452, 26, 8);
    };

    const rafRef = { current: 0 };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Analogy;
