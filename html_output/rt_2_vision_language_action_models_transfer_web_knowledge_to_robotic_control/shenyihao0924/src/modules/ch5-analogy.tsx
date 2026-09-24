import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawCookbook,
  drawStove,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Ch5 analogy (560x140, auto-loop 3s): the chef's schedule strip alternates
// theory cells (cookbook = web data) with practice cells (stove = robot data).
// One family glows at a time while the chef walks between them — book in hand
// on theory beats, spatula on practice beats. Nothing to click; it just runs.
const W = 560;
const H = 140;
const LOOP = 3000;
const N = 8; // schedule cells
const CELL = 44;
const GAP = 8;
const X0 = (W - (N * CELL + (N - 1) * GAP)) / 2;

export const Ch5Analogy: React.FC<WidgetProps> = () => {
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
    let raf = 0;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      const theoryBeat = t < 0.5;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // schedule strip: cells alternate book / stove, one family glows
      for (let i = 0; i < N; i++) {
        const isBook = i % 2 === 0;
        const on = isBook === theoryBeat;
        const x = X0 + i * (CELL + GAP);
        ctx.fillStyle = isBook ? (on ? '#d9e5f3' : '#eef3fa') : on ? '#d6eee2' : '#edf6f0';
        ctx.strokeStyle = on ? (isBook ? C.blue : C.green) : C.border;
        ctx.lineWidth = on ? 2.25 : 1;
        ctx.beginPath();
        ctx.roundRect(x, 34, CELL, CELL, 6);
        ctx.fill();
        ctx.stroke();
        if (isBook) {
          drawCookbook(ctx, x + CELL / 2, 72, 0.5);
        } else {
          drawStove(ctx, x + CELL / 2, 68, 0.5);
        }
      }
      // the chef walks back and forth, swapping book <-> spatula each half
      const wx = 120 + ((1 - Math.cos(t * 2 * Math.PI)) / 2) * 320;
      drawChef(ctx, wx, 112, 0.85, { mode: theoryBeat ? 'read' : 'cook', t: ms / 600 });
      drawSceneLabel(ctx, '今日课表', X0, 22);
      drawLegend(ctx, [['理论·书本', C.blue], ['实操·灶台', C.green]], X0, H - 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch5Analogy;
