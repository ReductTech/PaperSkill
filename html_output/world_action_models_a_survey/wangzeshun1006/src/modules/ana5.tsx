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
  CONTOUR,
  ROUTE,
  OK,
  EMPH,
  AUX,
  INK,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana5 — 把路线和地形绑起来。一根橙色路线从桩头出发，先绕过地形再回到路上（顺序式），
// 随后改为与等高线同步铺开（联合式）；两种绑法各演示一轮，移动主体只有测绘员。

const W = 560;
const H = 140;
const LOOP = 3400;

function at(pts: number[][], u: number): number[] {
  const t = clamp(u, 0, 1) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  const l = t - i;
  return [lerp(pts[i][0], pts[i + 1][0], l), lerp(pts[i][1], pts[i + 1][1], l)];
}

function partial(pts: number[][], u: number): number[][] {
  const t = clamp(u, 0, 1) * (pts.length - 1);
  const full = Math.floor(t);
  const out = pts.slice(0, full + 1).map((p) => p.slice());
  if (full < pts.length - 1) out.push(at(pts, u));
  return out;
}

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const seq = p < 0.5;
      const q = seq ? p / 0.5 : (p - 0.5) / 0.5;

      clearField(ctx, W, H);
      drawSheet(ctx, 140, 20, 300, 100);
      ctx.save();
      ctx.globalAlpha = seq ? 1 : 0.35 + 0.65 * q;
      drawContours(ctx, 144, 24, 292, 92, 9, CONTOUR, 4);
      ctx.restore();

      drawPin(ctx, 70, 100, EMPH, true);
      drawPin(ctx, 490, 60, OK, true);

      const seqPts = [
        [70, 100],
        [150, 118],
        [240, 120],
        [330, 96],
        [410, 92],
        [490, 60],
      ];
      const jointPts = [
        [70, 100],
        [180, 84],
        [300, 72],
        [400, 66],
        [490, 60],
      ];
      const pts = seq ? seqPts : jointPts;
      const color = seq ? EMPH : ROUTE;
      const cut = at(pts, q);
      drawRoute(ctx, partial(pts, q), color, 3);

      if (!seq) {
        const pulse = 0.4 + 0.4 * Math.abs(Math.sin(performance.now() / 240));
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = AUX;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cut[0], cut[1]);
        ctx.lineTo(cut[0] + 14, 46 + Math.sin(cut[0] * 0.05) * 10);
        ctx.stroke();
        ctx.restore();
      }

      drawSurveyor(ctx, cut[0], cut[1], 0.72, INK, seq ? 'draw' : 'plant');

      if (q > 0.95) {
        const a = clamp((q - 0.95) / 0.05, 0, 1);
        ctx.save();
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(490, 60, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawSheetLabel(ctx, '绑在一起', 20, 22, INK);
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

export default Ana5;
