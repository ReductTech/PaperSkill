import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawHold,
  drawClimber,
  drawChalkPuff,
  drawSceneLabel,
  HOLD,
  EMPH,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana1 — 一个主体（攀岩者）、一个动作（在新墙上盲探一步）、一个目标（抓住并从新摸索）。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

const CX = 300;
const FEET = 118;
const TARGET_Y = 84;

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
      // 盲探 → 抓住停住 → 松开退回起点
      const reach =
        t < 0.45
          ? easeOutCubic(Math.max(0, (t - 0.12) / 0.33))
          : t < 0.72
          ? 1
          : 1 - easeOutCubic(Math.max(0, (t - 0.72) / 0.2));
      const grabbed = t >= 0.45 && t < 0.72;

      clearCrag(ctx, W, H);
      drawWall(ctx, 210, 16, 330, 100, { veins: 3 });

      // 4 个岩点：目标点正对攀岩者手的位置
      drawHold(ctx, 250, 96, 7, HOLD);
      drawHold(ctx, 360, 60, 6, HOLD);
      drawHold(ctx, 450, 100, 6.5, HOLD);
      drawHold(ctx, 500, 48, 6, HOLD);
      drawHold(ctx, CX, TARGET_Y, 8, grabbed ? EMPH : HOLD, grabbed);

      if (grabbed) drawChalkPuff(ctx, CX, TARGET_Y, 0.6 + 0.4 * Math.sin(elapsed / 220));

      const pose = grabbed ? 'hang' : reach > 0.05 ? 'reach' : 'rest';
      drawClimber(ctx, CX, FEET, 0.95, reach > 0.05 || grabbed ? EMPH : MUTED, pose);

      drawSceneLabel(ctx, '陌生岩壁', 24, 28, MUTED);
      drawSceneLabel(ctx, '盲探一步', 24, 52, reach > 0.05 ? EMPH : MUTED);
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
