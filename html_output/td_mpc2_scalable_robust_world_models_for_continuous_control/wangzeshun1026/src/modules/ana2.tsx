import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { clearScene, drawTable, drawBall, drawCue, drawShot, drawPocket, drawSceneLabel, GUIDE, INK } from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻 2：球手不在脑内放电影，只判断“这一杆下去会怎样”。
// 一条预测轨迹先被画出来，白球再沿着它走。自动循环 2.8s。

const W = 560;
const H = 140;
const DUR = 2800;
const R = 8;
const PATH: number[][] = [
  [146, 76],
  [352, 30],
  [500, 66],
];
const POCKET = { x: 500, y: 66 };

function partialPath(f: number): number[][] {
  const pts = PATH;
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let remaining = total * clamp(f, 0, 1);
  const out: number[][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = segs[i - 1];
    if (remaining >= d) {
      out.push(pts[i]);
      remaining -= d;
    } else {
      const u = d === 0 ? 0 : remaining / d;
      out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
      break;
    }
  }
  return out;
}

function pointAt(f: number): number[] {
  const seg = partialPath(f);
  return seg[seg.length - 1];
}

function render(ctx: CanvasRenderingContext2D, t: number): void {
  clearScene(ctx, W, H);
  drawTable(ctx, 24, 16, 512, 92);

  const pred = clamp(t / 0.42, 0, 1);
  const moved = clamp((t - 0.48) / 0.36, 0, 1);
  const smooth = moved * moved * (3 - 2 * moved);

  // 只画一条“结果线”，不逐帧还原未来画面。
  const shown = pred < 1 ? partialPath(pred) : PATH;
  if (shown.length >= 2) drawShot(ctx, shown, GUIDE, 1.6, [6, 5]);

  const start = PATH[0];
  const aim = Math.atan2(PATH[1][1] - start[1], PATH[1][0] - start[0]);
  if (t < 0.52) {
    const px = start[0] + Math.cos(aim) * (R + 8);
    const py = start[1] + Math.sin(aim) * (R + 8);
    drawCue(ctx, px, py, aim, 78);
  }

  const p = pointAt(smooth);
  drawBall(ctx, p[0], p[1], R, '#f3f0e4', true);

  drawPocket(ctx, POCKET.x, POCKET.y, 11);
  drawSceneLabel(ctx, '只判断结果', 36, 36, INK);
  drawSceneLabel(ctx, '不重建画面', 250, 100, INK);
}

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

    const t0 = performance.now();
    const tick = () => {
      const t = ((performance.now() - t0) % DUR) / DUR;
      render(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
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
