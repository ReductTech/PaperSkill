import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawRope,
  drawChalkPuff,
  drawSceneLabel,
  drawLegend,
  HOLD,
  GUIDE,
  OK,
  EMPH,
  AUX,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana5 — 一个主体（攀岩者）、一个动作（轻拉新点试探承重）、一个目标（确认稳了再移重心）。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const CYCLE = 2800;

const WALL_X = 40;
const WALL_Y = 30;
const WALL_W = 480;
const WALL_H = 92;

const HOLD_A = { x: 158, y: 98 };
const HOLD_B = { x: 352, y: 58 };

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

    const render = (elapsed: number): void => {
      const t = (elapsed % CYCLE) / CYCLE;

      clearCrag(ctx, W, H);
      drawWall(ctx, WALL_X, WALL_Y, WALL_W, WALL_H);

      const reach = easeOutCubic(clamp(t / 0.30, 0, 1));
      const pull = clamp((t - 0.30) / 0.26, 0, 1);
      const shift = easeOutCubic(clamp((t - 0.54) / 0.30, 0, 1));

      // 被试探的新点：轻轻下沉一下，随即稳住
      const sink = Math.sin(pull * Math.PI) * 5;
      const tested = { x: HOLD_B.x, y: HOLD_B.y + sink };

      // 身体先留在原支点，试探确认后把重心移过去
      const bodyX = lerp(HOLD_A.x, tested.x, shift);
      const bodyY = lerp(HOLD_A.y, tested.y, shift);

      // 绳索从顶端锚点连到攀岩者
      drawRope(
        ctx,
        [
          [280, 26],
          [lerp(280, bodyX, 0.5), lerp(60, bodyY, 0.5)],
          [bodyX, bodyY - 26],
        ],
        AUX,
        2
      );

      drawHold(ctx, HOLD_A.x, HOLD_A.y, 9, HOLD, false);
      drawHold(ctx, tested.x, tested.y, 10, EMPH, pull > 0.02 && pull < 0.98);

      // 试探发力时指尖带出一小团镁粉
      if (pull > 0.04 && pull < 0.96) {
        drawChalkPuff(ctx, tested.x + 8, tested.y - 12, 0.55);
      }

      drawClimber(
        ctx,
        bodyX,
        bodyY - 4,
        1.0,
        pull > 0.55 ? OK : GUIDE,
        reach < 0.55 ? 'reach' : 'hang'
      );

      drawSceneLabel(ctx, '试探承重', WALL_X + 4, 20, MUTED);
      drawSceneLabel(ctx, '稳住发力', 300, 20, pull > 0.6 ? OK : MUTED);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '新点' },
          { color: GUIDE, text: '当前' },
        ],
        WALL_X,
        134
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

export default Ana5;
