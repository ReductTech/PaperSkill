import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  drawLegend,
  makeProfile,
  OK,
  WOOD_DARK,
  BAD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 6 analogy (560x140, automatic 3.2 s loop):
// three long passes bring the board onto the green target line, while the shavings
// of the two earlier passes stay on the surface — the same result with fewer cuts.
const W = 560;
const H = 140;
const LOOP = 3200;
const BX = 40;
const BY = 102;
const BW = 480;
const BH = 16;
const PTS = 26;
const AMP0 = 20;

/** Sequential pass progress: 0 before the pass starts, 1 once it is finished. */
const seg = (u: number, a: number, b: number): number => clamp((u - a) / (b - a), 0, 1);

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p1 = seg(u, 0.02, 0.26);
      const p2 = seg(u, 0.3, 0.54);
      const p3 = seg(u, 0.58, 0.82);

      // each long pass takes off part of the remaining bump height
      let amp = AMP0;
      amp = lerp(amp, 13, p1);
      amp = lerp(amp, 6.5, p2);
      amp = lerp(amp, 0.7, p3);
      const flat = 1 - amp / AMP0;

      clearScene(ctx, W, H);

      // green target surface
      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BX, BY + 0.5);
      ctx.lineTo(BX + BW, BY + 0.5);
      ctx.stroke();

      drawBoard(ctx, BX, BY, BW, BH, makeProfile(PTS, amp, 7), {
        profileColor: lerpColor(BAD, OK, flat),
      });

      // plane position: three long passes, direction alternating
      let px: number;
      if (p3 >= 1) px = BX + BW - 14;
      else if (p3 > 0) px = lerp(BX + 14, BX + BW - 14, p3);
      else if (p2 >= 1) px = BX + 14;
      else if (p2 > 0) px = lerp(BX + BW - 14, BX + 14, p2);
      else if (p1 >= 1) px = BX + BW - 14;
      else if (p1 > 0) px = lerp(BX + 14, BX + BW - 14, p1);
      else px = BX + 14;

      const cutting = (p1 > 0 && p1 < 1) || (p2 > 0 && p2 < 1) || (p3 > 0 && p3 < 1);
      // traces the first two passes left behind
      if (p1 >= 1) drawShavings(ctx, BX + BW - 130, BY - 14, 0.2, 2);
      if (p2 >= 1) drawShavings(ctx, BX + 200, BY - 11, 0.6, 2);
      if (cutting) drawShavings(ctx, px - 16, BY - 5, elapsed / 420, 3);

      drawPlane(ctx, px, BY, { length: 108 });

      drawSceneLabel(ctx, '三刀到位', BX, 28);
      drawLegend(
        ctx,
        [
          { color: WOOD_DARK, text: '板面' },
          { color: OK, text: '目标面' },
        ],
        350,
        28
      );
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

export default Ana5;
