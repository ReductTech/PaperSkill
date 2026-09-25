import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad, lerpColor } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawLegend,
  makeProfile,
  OK,
  BAD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 3 analogy — 一刀不修到底，只修一点点 (automatic 3.2 s loop).
// The plane makes three short passes; the profile drops one notch per pass and
// ends up coinciding with the green target line.

const W = 560;
const H = 140;
const LOOP = 3200;
const BX = 70;
const BY = 92;
const BW = 420;
const BH = 25;
const AMPS = [22, 14, 7, 0];
const SEG = 0.28;
const GAP = 0.045;

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const shape = makeProfile(30, 1, 11).map((v) => Math.abs(v));
    let t0: number | null = null;

    const render = (now: number) => {
      if (t0 === null) t0 = now;
      const p = ((now - t0) % LOOP) / LOOP;
      clearScene(ctx, W, H);

      let amp = AMPS[0];
      let planeOn = false;
      let reversed = false;
      let planeX = BX + 14;
      for (let i = 0; i < 3; i++) {
        const s0 = i * (SEG + GAP);
        const s1 = s0 + SEG;
        if (p >= s1) {
          amp = AMPS[i + 1];
        } else if (p >= s0) {
          const u = easeInOutQuad((p - s0) / SEG);
          amp = lerp(AMPS[i], AMPS[i + 1], u);
          reversed = i % 2 === 1;
          planeX = reversed ? lerp(BX + BW - 14, BX + 14, u) : lerp(BX + 14, BX + BW - 14, u);
          planeOn = true;
        }
      }

      // green target line first, then the board so the profile sits on top of it
      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BX, BY);
      ctx.lineTo(BX + BW, BY);
      ctx.stroke();

      drawBoard(
        ctx,
        BX,
        BY,
        BW,
        BH,
        shape.map((v) => v * amp),
        { profileColor: lerpColor(BAD, OK, 1 - amp / AMPS[0]) }
      );

      if (planeOn) {
        drawPlane(ctx, planeX, BY, { length: 54, flip: reversed });
        drawShavings(ctx, planeX + (reversed ? -16 : 16), BY - 12, now / 1000, 3);
      }

      drawLegend(
        ctx,
        [
          { color: BAD, text: '剩余凸起' },
          { color: OK, text: '目标平整线' },
        ],
        BX,
        30
      );
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

export default Ana2;
