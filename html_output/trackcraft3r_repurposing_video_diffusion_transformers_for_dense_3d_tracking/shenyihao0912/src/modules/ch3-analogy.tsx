import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawTrail } from './dogKit';
import type { Pt } from './dogKit';
import type { WidgetProps } from './registry';

// Ch3 analogy card: a green stamp presses once onto the dog's nose; the mark then
// follows the nose exactly as the head turns slowly left and right.
const W = 560;
const H = 140;
const LOOP = 3200;

export const Ch3Analogy: React.FC<WidgetProps> = () => {
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
    const dogX = W * 0.5;
    const groundY = H - 30;
    const STAMP = 0.3; // fraction of the loop spent descending

    const noseAt = (phase: number): Pt => ({
      x: dogX + 24 + Math.sin(phase * Math.PI * 3) * 7,
      y: groundY - 26 - Math.abs(Math.sin(phase * Math.PI * 3)) * 2,
    });

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawDog(ctx, dogX, groundY, 1.05, { mood: 'idle', t });
      if (t < STAMP) {
        // the stamp descends onto the nose
        const p = easeOutCubic(t / STAMP);
        const nose = noseAt(0);
        const sy = lerp(4, nose.y - 16, p);
        ctx.strokeStyle = C.deep;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(nose.x, Math.max(sy - 24, 4));
        ctx.lineTo(nose.x, sy - 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(nose.x - 9, sy - 11, 18, 11, 2);
        ctx.stroke();
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.roundRect(nose.x - 7, sy - 9, 14, 7, 2);
        ctx.fill();
      } else {
        // the mark persists and rides the turning nose exactly
        const phase = (t - STAMP) / (1 - STAMP);
        const pts: Pt[] = [];
        for (let i = 0; i <= 10; i++) {
          const ph = phase - i * 0.03;
          if (ph < 0) break;
          pts.push(noseAt(ph));
        }
        drawTrail(ctx, pts, C.green);
        const nose = noseAt(phase);
        drawTracker(ctx, nose.x, nose.y, 3.2);
      }
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

export default Ch3Analogy;
