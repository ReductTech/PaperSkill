import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawFilmStrip, drawTimeCard, drawDog } from './dogKit';
import type { WidgetProps } from './registry';

// 喊时间：a film strip of 6 cells; an orange time card flips 第1秒 → 第6秒 and the
// matching cell lights up softly on each flip. The videographer's dog waits beside
// the strip. Auto-looping 560×140 analogy card — no controls, no feedback.

const W = 560;
const H = 140;
const LOOP = 3.0; // seconds per full pass over the 6 cells
const N = 6;

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
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (now: number) => {
      const wall = (now - t0) / 1000;
      const t = wall % LOOP;
      const seg = Math.min(Math.floor((t / LOOP) * N), N - 1);
      const p = (t / LOOP) * N - seg;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      const sx = 124;
      const sy = 84;
      drawFilmStrip(ctx, sx, sy, N);

      // the matching cell lights up softly on each flip
      const cellX = sx + seg * 54;
      ctx.save();
      ctx.globalAlpha = 0.16 + 0.1 * Math.sin(Math.PI * Math.min(p * 1.4, 1));
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(cellX, sy - 12, 46, 52, 4);
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cellX, sy - 12, 46, 52, 4);
      ctx.stroke();
      ctx.restore();

      // the dog waits beside the strip
      drawDog(ctx, 62, 120, 0.7, { mood: 'idle', t: wall });

      // orange time card flips 第1秒 → 第6秒 above the matching cell
      const toX = sx + seg * 54 + 23;
      const fromX = seg === 0 ? toX : sx + (seg - 1) * 54 + 23;
      const slide = easeOutCubic(Math.min(p / 0.3, 1));
      const pop = 1 + 0.1 * Math.sin(Math.PI * Math.min(p * 1.6, 1));
      ctx.save();
      ctx.translate(fromX + (toX - fromX) * slide, 36);
      ctx.scale(pop, pop);
      drawTimeCard(ctx, 0, 0, `第${seg + 1}秒`);
      ctx.restore();
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

export default Ch5Analogy;
