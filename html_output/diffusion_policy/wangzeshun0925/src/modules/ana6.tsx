import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  makeProfile,
  OK,
  BAD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 7 analogy (560x140, automatic 2.8 s loop):
// two identical boards are planed in sync. The left plane jumps in depth and the
// board gets rougher; the right plane keeps the same depth and the board goes flat.
const W = 560;
const H = 140;
const LOOP = 2800;
const BY = 102;
const BH = 16;
const PTS = 22;
const LX = 24;
const RX = 300;
const BW = 236;
const AMP0 = 12;

/** Sequential pass progress: 0 before the pass starts, 1 once it is finished. */
const seg = (u: number, a: number, b: number): number => clamp((u - a) / (b - a), 0, 1);

/** The left hand's depth for the four passes — deliberately uneven. */
const DEPTH = [0, 4, 1, 6];

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (elapsed: number) => {
      const u = (elapsed % LOOP) / LOOP;
      const p1 = seg(u, 0.04, 0.26);
      const p2 = seg(u, 0.3, 0.52);
      const p3 = seg(u, 0.56, 0.78);
      const p4 = seg(u, 0.82, 0.98);

      const run = easeInOutQuad(u);
      const ampR = lerp(AMP0, 1, run); // steady depth: the board converges
      const ampL = lerp(AMP0, 22, run); // jumping depth: the board gets worse

      // the left surface keeps scrambling between two shapes, pass after pass
      const blend = 0.5 - 0.5 * Math.cos(u * Math.PI * 6);
      const profA = makeProfile(PTS, ampL, 11);
      const profB = makeProfile(PTS, ampL, 23);
      const profL = profA.map((v, i) => lerp(v, profB[i], blend));
      const profR = makeProfile(PTS, ampR, 11);

      clearScene(ctx, W, H);

      // green target surface under both boards
      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LX, BY + 0.5);
      ctx.lineTo(LX + BW, BY + 0.5);
      ctx.moveTo(RX, BY + 0.5);
      ctx.lineTo(RX + BW, BY + 0.5);
      ctx.stroke();

      drawBoard(ctx, LX, BY, BW, BH, profL, { profileColor: BAD });
      drawBoard(ctx, RX, BY, BW, BH, profR, { profileColor: OK });

      // both planes sweep in sync; the left one sinks to an uneven depth
      let f = 0;
      let dir = 1;
      let passIdx = 0;
      if (p4 > 0) {
        f = p4;
        dir = -1;
        passIdx = 3;
      } else if (p3 > 0) {
        f = p3;
        dir = 1;
        passIdx = 2;
      } else if (p2 > 0) {
        f = p2;
        dir = -1;
        passIdx = 1;
      } else if (p1 > 0) {
        f = p1;
        dir = 1;
        passIdx = 0;
      }
      const depthL = DEPTH[passIdx];
      const xL = dir > 0 ? lerp(LX + 16, LX + BW - 16, f) : lerp(LX + BW - 16, LX + 16, f);
      const xR = dir > 0 ? lerp(RX + 16, RX + BW - 16, f) : lerp(RX + BW - 16, RX + 16, f);

      const cutting = (p1 > 0 && p1 < 1) || (p2 > 0 && p2 < 1) || (p3 > 0 && p3 < 1) || (p4 > 0 && p4 < 1);
      if (cutting) {
        drawShavings(ctx, xL - 14, BY - 4 + depthL, elapsed / 380, 3);
        drawShavings(ctx, xR - 14, BY - 4, elapsed / 380, 2);
      }

      drawPlane(ctx, xL, BY + depthL, { length: 54 });
      drawPlane(ctx, xR, BY, { length: 54 });

      drawSceneLabel(ctx, '忽深忽浅', LX, 28, BAD);
      drawSceneLabel(ctx, '每刀一样深', RX, 28, OK);
    };

    const tick = () => {
      render(performance.now() - t0);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana6;
