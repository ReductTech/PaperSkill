import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSurveyor,
  drawTripod,
  drawCompass,
  drawScaleBar,
  drawPin,
  drawRoute,
  drawSheetLabel,
  CONTOUR,
  OK,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana3 — 四件仪器定一个点。测绘员依次用三脚架测角、两脚规量距、比例尺对图、插下路线桩，
// 四个读数共同定住图上一"点"，最后落笔标记；循环演示。

const W = 560;
const H = 140;
const LOOP = 3000;

const POSES = ['sight', 'draw', 'check', 'plant', 'draw'] as const;

function at(pts: number[][], u: number): number[] {
  const t = clamp(u, 0, 1) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  const l = t - i;
  return [lerp(pts[i][0], pts[i + 1][0], l), lerp(pts[i][1], pts[i + 1][1], l)];
}

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
    const t0 = performance.now();

    const render = (): void => {
      const p = ((performance.now() - t0) % LOOP) / LOOP;
      const seg = clamp(p, 0, 0.9999) * 4;
      const idx = Math.min(3, Math.floor(seg));
      const local = seg - idx;

      clearField(ctx, W, H);
      drawSheet(ctx, 200, 22, 190, 64);
      drawContours(ctx, 204, 26, 182, 56, 5, CONTOUR, 3);
      drawRoute(
        ctx,
        [
          [70, 116],
          [190, 102],
          [300, 102],
          [450, 102],
        ],
        LINE,
        1.5
      );

      drawTripod(ctx, 70, 118, 0.7, INK);
      drawCompass(ctx, 190, 102, 15, AUX);
      drawScaleBar(ctx, 296, 102, 78, MUTED, 4);
      drawPin(ctx, 450, 102, EMPH, idx === 3 && local < 0.5);

      const path = [
        [70, 116],
        [190, 102],
        [300, 102],
        [450, 102],
        [330, 52],
      ];
      const pos = at(path, p);
      drawSurveyor(ctx, pos[0], pos[1], 0.8, INK, POSES[idx]);

      if (p > 0.86) {
        const a = clamp((p - 0.86) / 0.1, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.arc(330, 52, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(330, 52, 10 + 7 * a, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawSheetLabel(ctx, '四器定一点', 60, 24, INK);
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

export default Ana3;
