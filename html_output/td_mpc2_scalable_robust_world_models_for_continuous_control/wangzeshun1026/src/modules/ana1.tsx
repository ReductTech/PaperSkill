import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { clearScene, drawTable, drawBall, drawCue, drawShot, drawPocket, drawSceneLabel, GUIDE, INK } from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻 1：同一位球手，球一换位置就得重新瞄、重新找手感。
// 一个主体（白球）、一个动作（出杆）、一个目标（进袋）。自动循环 3.0s。

const W = 560;
const H = 140;
const DUR = 3000;
const R = 8;
const POCKET = { x: 500, y: 62 };
const LANES = [
  { x: 132, y: 40 },
  { x: 168, y: 62 },
  { x: 128, y: 84 },
];

function render(ctx: CanvasRenderingContext2D, t: number, cycle: number): void {
  clearScene(ctx, W, H);
  drawTable(ctx, 24, 16, 512, 92);
  drawPocket(ctx, POCKET.x, POCKET.y, 11);

  const lane = LANES[cycle % LANES.length];
  const aim = Math.atan2(POCKET.y - lane.y, POCKET.x - lane.x);

  // 预测线：换一个站位，就要重算一条线。
  drawShot(ctx, [[lane.x, lane.y], [POCKET.x, POCKET.y]], GUIDE, 1.5, [5, 5]);

  // 球杆只作为静态道具出现；移动的只有白球。
  const px = lane.x + Math.cos(aim) * (R + 8);
  const py = lane.y + Math.sin(aim) * (R + 8);
  drawCue(ctx, px, py, aim, 86);

  const travel = clamp((t - 0.22) / 0.46, 0, 1);
  const eased = travel * travel * (3 - 2 * travel);
  const bx = lerp(lane.x, POCKET.x, eased);
  const by = lerp(lane.y, POCKET.y, eased);
  drawBall(ctx, bx, by, R, '#f3f0e4', true);

  // 袋口最后画，球到达时自然被“吞”进去。
  drawPocket(ctx, POCKET.x, POCKET.y, 11);
  drawSceneLabel(ctx, '换一种球型', 36, 132, INK);
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
    const tick = () => {
      const elapsed = performance.now() - t0;
      const t = (elapsed % DUR) / DUR;
      const cycle = Math.floor(elapsed / DUR);
      render(ctx, t, cycle);
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

export default Ana1;
