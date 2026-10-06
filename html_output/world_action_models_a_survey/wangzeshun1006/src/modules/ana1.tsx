import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawSurveyor,
  drawRoute,
  drawSheetLabel,
  CONTOUR,
  ROUTE,
  EMPH,
  INK,
  MUTED,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana1 — 一个主体（测绘员）、一个动作（把基准桩打入空白图纸）、一个目标（拉出第一条基准线）。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

const SHEET_X = 120;
const SHEET_Y = 26;
const SHEET_W = 380;
const SHEET_H = 80;
const FOOT_Y = 100;
const STAKE_X = 392;
const STAKE_TOP = 56;

function ropePts(top: number, u: number): number[][] {
  const pts: number[][] = [];
  const n = 16;
  const steps = Math.max(2, Math.round(n * u));
  for (let k = 0; k <= steps; k++) {
    const v = (k / n) * u;
    const x = lerp(STAKE_X, 150, v);
    const y = lerp(top, 94, v) + Math.sin(v * Math.PI) * 7;
    pts.push([x, y]);
  }
  return pts;
}

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;

      const ap = easeOutCubic(clamp(t / 0.34, 0, 1));
      const sx = lerp(250, 352, ap);
      const st = clamp((t - 0.34) / 0.26, 0, 1);
      const rp = easeOutCubic(clamp((t - 0.66) / 0.28, 0, 1));

      clearField(ctx, W, H);
      drawSheet(ctx, SHEET_X, SHEET_Y, SHEET_W, SHEET_H, { border: CONTOUR });

      // 基准桩：被打入地面，逐渐下沉
      const sink = st * 8;
      const top = STAKE_TOP + sink;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(STAKE_X, top);
      ctx.lineTo(STAKE_X, FOOT_Y + sink * 0.4);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(STAKE_X, top, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 打入时的锤击光晕
      if (st > 0 && st < 1) {
        ctx.save();
        const pulse = 0.35 + 0.35 * Math.abs(Math.sin(st * Math.PI * 3));
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(STAKE_X, top, 9 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 从桩头拉出的第一条基准线
      if (rp > 0.01) drawRoute(ctx, ropePts(top, rp), ROUTE, 2.5);

      // 主体：测绘员
      const pose = t < 0.34 ? 'walk' : t < 0.62 ? 'plant' : 'sight';
      const active = st > 0.05 && st < 0.95;
      drawSurveyor(ctx, sx, FOOT_Y, 1, active ? EMPH : INK, pose);

      drawSheetLabel(ctx, '空白图幅', 20, 52, MUTED);
      drawSheetLabel(ctx, '立基准桩', 20, 80, st > 0.1 ? EMPH : MUTED);
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana1;
