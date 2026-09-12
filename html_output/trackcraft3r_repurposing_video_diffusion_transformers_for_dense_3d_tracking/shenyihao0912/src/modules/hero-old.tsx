import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTrail, drawLegend, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: chained/iterative tracking — the red estimated trail
// drifts further off the dog's true straight path as segment ticks pass.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroOld: React.FC<WidgetProps> = () => {
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
    const groundY = H - 44;
    const dogX = (t: number) => 60 + t * 400;
    // chained estimate: accumulates a growing offset after each of 5 segment ticks
    const drift = (t: number) => Math.pow(t, 2) * 70 * Math.sin(t * 9);

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // true path (what the dog actually did)
      drawTrail(ctx, [
        { x: dogX(0), y: groundY - 26 },
        { x: dogX(1), y: groundY - 26 },
      ], C.muted);
      // segment ticks where chaining hands over
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      for (let i = 1; i <= 5; i++) {
        const tx = dogX(i / 6);
        ctx.beginPath();
        ctx.moveTo(tx, groundY - 60);
        ctx.lineTo(tx, groundY - 6);
        ctx.stroke();
      }
      // drifting chained trail
      const pts = [] as { x: number; y: number }[];
      for (let i = 0; i <= 24; i++) {
        const u = (i / 24) * t;
        pts.push({ x: dogX(u), y: groundY - 26 - drift(u) });
      }
      drawTrail(ctx, pts, C.red);
      // dog
      drawDog(ctx, dogX(t), groundY, 1.25, { mood: 'walk', t });
      // current wrong estimate point
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(dogX(t), groundY - 26 - drift(t), 5, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '链式', 14, 20, { color: C.red });
      drawLegend(
        ctx,
        [
          ['6 步迭代', C.red],
          ['4D 相关', C.muted],
          ['35.46 GB', C.blue],
        ],
        14,
        H - 16
      );
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

  return <canvas ref={ref} width={W} height={H} className="hero-cv" />;
};

export default HeroOld;
