import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawChalkPuff,
  drawSceneLabel,
  drawLegend,
  EMPH,
  GUIDE,
  HOLD,
  INK,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana3 — 先在心里爬一遍：攀岩者闭眼站在墙前，一只手在空气中沿蓝色虚线依次划过三个支点，
// 完成整条序列后睁眼回到站姿。自动循环，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

// 空中复演的三个动作点（虚线路线）
const ROUTE: number[][] = [
  [342, 100],
  [404, 74],
  [468, 46],
];

function polyPoint(u: number): number[] {
  const seg = clamp(u, 0, 1) * (ROUTE.length - 1);
  const i = Math.min(ROUTE.length - 2, Math.floor(seg));
  const f = seg - i;
  return [lerp(ROUTE[i][0], ROUTE[i + 1][0], f), lerp(ROUTE[i][1], ROUTE[i + 1][1], f)];
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

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;
      clearCrag(ctx, W, H);
      drawWall(ctx, 300, 16, 220, 104);

      // 蓝色虚线：脑内复演的路线
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ROUTE[0][0], ROUTE[0][1]);
      for (let i = 1; i < ROUTE.length; i++) ctx.lineTo(ROUTE[i][0], ROUTE[i][1]);
      ctx.stroke();
      ctx.restore();

      for (const p of ROUTE) drawHold(ctx, p[0], p[1], 6, HOLD);

      const tracing = t >= 0.12 && t < 0.86;
      const traceU = tracing ? clamp((t - 0.12) / 0.72, 0, 1) : t >= 0.86 ? 1 : 0;
      const hand = polyPoint(traceU);

      // 主体：轻微摆动的攀岩者
      const sway = Math.sin(t * Math.PI * 2) * 4;
      const cx = 150 + sway;
      drawClimber(ctx, cx, 116, 1, INK, tracing ? 'reach' : 'rest');

      // 空中的手 + 粉笔痕
      if (tracing || t >= 0.86) {
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + 8, 92);
        ctx.lineTo(hand[0], hand[1]);
        ctx.stroke();
        ctx.restore();
        drawChalkPuff(ctx, hand[0], hand[1], tracing ? 0.9 : 0.5);
        ctx.fillStyle = EMPH;
        ctx.beginPath();
        ctx.arc(hand[0], hand[1], 4, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSceneLabel(ctx, '脑内复演', 24, 30, tracing ? GUIDE : INK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '想象路线' },
          { color: EMPH, text: '手' },
        ],
        300,
        133
      );
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

export default Ana3;
