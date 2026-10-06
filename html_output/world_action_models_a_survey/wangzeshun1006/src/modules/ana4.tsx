import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSurveyor,
  drawRoute,
  drawPin,
  drawSheetLabel,
  seeded,
  CONTOUR,
  OK,
  EMPH,
  INK,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana4 — 落下第一笔：画哪一层。同一片山地的四张底图叠放，笔尖依次在四张图上各画一笔
// （阴影、等高线、路网、通行标记），随后收笔，循环。移动主体只有测绘员。

const W = 560;
const H = 140;
const LOOP = 3200;

function at(pts: number[][], u: number): number[] {
  const t = clamp(u, 0, 1) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  const l = t - i;
  return [lerp(pts[i][0], pts[i + 1][0], l), lerp(pts[i][1], pts[i + 1][1], l)];
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();
    const sx = [16, 150, 284, 418];
    const sy = [32, 38, 44, 50];
    const sw = 120;
    const sh = 74;

    const render = (): void => {
      const p = ((performance.now() - t0) % LOOP) / LOOP;
      clearField(ctx, W, H);

      for (let i = 0; i < 4; i++) {
        drawSheet(ctx, sx[i], sy[i], sw, sh);
        drawContours(ctx, sx[i] + 4, sy[i] + 4, sw - 8, sh - 8, 5 + i * 3, CONTOUR, i === 0 ? 5 : 3);

        const appear = clamp((p - (0.08 + i * 0.22)) / 0.18, 0, 1);
        if (i === 0 && appear > 0) {
          const rnd = seeded(3);
          ctx.save();
          ctx.globalAlpha = appear;
          ctx.fillStyle = 'rgba(33,50,74,0.07)';
          for (let k = 0; k < 5; k++) {
            ctx.beginPath();
            ctx.arc(sx[i] + 20 + rnd() * 80, sy[i] + 16 + rnd() * 44, 9 + rnd() * 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        if (i === 2 && appear > 0) {
          const q = appear;
          const pts = [
            [sx[i] + 12, sy[i] + 52],
            [sx[i] + 46, sy[i] + 34],
            [sx[i] + 82, sy[i] + 40],
            [sx[i] + 108, sy[i] + 20],
          ];
          const cut = at(pts, q);
          ctx.save();
          ctx.globalAlpha = 0.95;
          drawRoute(ctx, [pts[0], cut], EMPH, 2.5);
          ctx.restore();
        }
        if (i === 3 && appear > 0) {
          const n = Math.round(appear * 4);
          for (let k = 0; k < n; k++) {
            drawPin(ctx, sx[i] + 26 + k * 24, sy[i] + 46 - (k % 2) * 16, OK, true);
          }
        }
      }

      const path = [
        [24, 118],
        [158, 122],
        [292, 128],
        [426, 134],
      ];
      const pos = at(path, p);
      drawSurveyor(ctx, pos[0], pos[1], 0.78, INK, 'draw');

      drawSheetLabel(ctx, '先画一层', 20, 22, INK);
    };

    const loop = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
  );
};

export default Ana4;
