import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  OK,
  BAD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 5 analogy — 顺纹与逆纹 (automatic 2.8 s loop).
// Two identical boards are planed in sync: the left one against the grain tears
// into red burrs, the right one with the grain leaves a smooth green surface.

const W = 560;
const H = 140;
const LOOP = 2800;
const BW = 200;
const BH = 20;
const BY = 96;
const LX = 46;
const RX = 314;
const SWEEP = 0.72;
const RET = 0.86;

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const zigzag = (x0: number, x1: number, y: number, color: string) => {
      if (x1 - x0 < 5) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let up = true;
      ctx.moveTo(x0, y);
      for (let x = x0 + 5; x <= x1; x += 5) {
        ctx.lineTo(x, y - (up ? 4 : 0));
        up = !up;
      }
      ctx.stroke();
    };

    let t0: number | null = null;

    const render = (now: number) => {
      if (t0 === null) t0 = now;
      const p = ((now - t0) % LOOP) / LOOP;
      clearScene(ctx, W, H);

      let u = 0;
      let alpha = 1;
      let flipped = false;
      if (p < SWEEP) {
        u = easeInOutQuad(p / SWEEP);
      } else if (p < RET) {
        u = 1;
      } else {
        const v = (p - RET) / (1 - RET);
        u = 1 - easeInOutQuad(v);
        alpha = 1 - v;
        flipped = true;
      }

      drawBoard(ctx, LX, BY, BW, BH, null);
      drawBoard(ctx, RX, BY, BW, BH, null);

      const cutL = lerp(LX + 6, LX + BW - 8, u);
      const cutR = lerp(RX + 6, RX + BW - 8, u);
      const planeL = lerp(LX + 14, LX + BW - 14, u);
      const planeR = lerp(RX + 14, RX + BW - 14, u);

      ctx.globalAlpha = alpha;
      zigzag(LX + 6, cutL, BY, BAD);
      ctx.strokeStyle = OK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(RX + 6, BY);
      ctx.lineTo(cutR, BY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (p < RET) {
        drawPlane(ctx, planeL, BY - 2, { length: 44 });
        drawPlane(ctx, planeR, BY - 2, { length: 44 });
        drawShavings(ctx, planeL - 16, BY - 12, now / 1000, 3);
        drawShavings(ctx, planeR - 16, BY - 12, now / 1000, 3);
      } else {
        drawPlane(ctx, planeL, BY - 2, { length: 44, flip: flipped });
        drawPlane(ctx, planeR, BY - 2, { length: 44, flip: flipped });
      }

      drawSceneLabel(ctx, '逆纹', 128, 44, BAD);
      drawSceneLabel(ctx, '顺纹', 396, 44, OK);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana3;
