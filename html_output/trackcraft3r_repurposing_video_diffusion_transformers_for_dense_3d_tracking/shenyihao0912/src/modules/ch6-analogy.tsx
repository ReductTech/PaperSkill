import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import { C, drawSceneBg, drawFilmStrip, drawDog, drawTracker } from './dogKit';
import type { WidgetProps } from './registry';

// 记号卡复印：a green stamp card slides along a static 5-cell film strip, pressing
// an identical green mark into every cell; pressed marks persist. Auto-looping
// 560×140 analogy card — no controls, no feedback.

const W = 560;
const H = 140;
const LOOP = 3.2; // seconds per full pass over the 5 cells
const N = 5;

const cellCX = (i: number) => 150 + 54 * i + 23;

const drawStampCard = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);
  // knob
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.roundRect(-3, -26, 6, 14, 2);
  ctx.fill();
  // card body
  ctx.fillStyle = C.green;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-13, -12, 26, 20, 4);
  ctx.fill();
  ctx.stroke();
  // mark motif on the card face
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(0, -2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const Ch6Analogy: React.FC<WidgetProps> = () => {
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
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (now: number) => {
      const wall = (now - t0) / 1000;
      const t = wall % LOOP;
      const seg = Math.min(Math.floor((t / LOOP) * N), N - 1);
      const p = (t / LOOP) * N - seg;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      const sy = 86;
      drawFilmStrip(ctx, 150, sy, N);
      drawDog(ctx, 58, 122, 0.62, { mood: 'idle', t: wall });

      // identical green marks persist in every pressed cell
      for (let i = 0; i < N; i++) {
        if (i < seg || (i === seg && p >= 0.42)) drawTracker(ctx, cellCX(i), sy + 16, 5);
      }

      // the stamp card travels left → right, pressing as it goes
      const restX = cellCX(seg);
      const nextX = seg < N - 1 ? cellCX(seg + 1) : restX;
      const x = p < 0.6 ? restX : lerp(restX, nextX, easeInOutQuad((p - 0.6) / 0.4));
      let y: number;
      if (p < 0.4) y = lerp(40, 90, easeInOutQuad(p / 0.4));
      else if (p < 0.6) y = 90;
      else y = lerp(90, 40, easeInOutQuad((p - 0.6) / 0.4));
      drawStampCard(ctx, x, y);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch6Analogy;
