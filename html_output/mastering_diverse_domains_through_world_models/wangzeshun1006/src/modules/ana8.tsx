import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawRope,
  drawFlag,
  drawSceneLabel,
  GUIDE,
  OK,
  EMPH,
  HOLD,
  INK,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana8 — 触顶，完攀。
// 攀岩者沿蓝色路线连爬最后两步，伸手触碰顶端金色目标点；目标亮起绿环后停住。自动循环。

const W = 560;
const H = 140;
const DUR = 3200;

const WALL_X = 70;
const WALL_Y = 18;
const WALL_W = 190;
const WALL_H = 106;

const STEP: number[][] = [
  [122, 100],
  [152, 82],
  [182, 64],
  [208, 44],
];

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number): void => {
      const t = ((now - t0) % DUR) / DUR;
      clearCrag(ctx, W, H);
      drawWall(ctx, WALL_X, WALL_Y, WALL_W, WALL_H);

      const climb = easeOutCubic(clamp((t - 0.12) / 0.5, 0, 1));
      const done = t >= 0.62;

      // 蓝色路线
      ctx.save();
      ctx.setLineDash([7, 6]);
      drawRope(
        ctx,
        [
          [122, 108],
          [152, 82],
          [182, 64],
          [208, 44],
        ],
        GUIDE,
        3
      );
      ctx.restore();

      for (let i = 0; i < STEP.length; i++) {
        const reached = climb * (STEP.length - 1) >= i - 0.3;
        drawHold(ctx, STEP[i][0], STEP[i][1], 6, reached ? GUIDE : HOLD, reached);
      }

      // 顶端目标点：触碰后亮绿环
      drawHold(ctx, STEP[STEP.length - 1][0], STEP[STEP.length - 1][1], 8, done ? OK : EMPH, done);
      if (done) {
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(STEP[STEP.length - 1][0], STEP[STEP.length - 1][1], 17, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawFlag(ctx, STEP[STEP.length - 1][0], STEP[STEP.length - 1][1] - 6, done ? OK : EMPH);

      // 攀岩者连爬最后两步
      const seg = climb * (STEP.length - 1);
      const i0 = clamp(Math.floor(seg), 0, STEP.length - 2);
      const f = clamp(seg - i0, 0, 1);
      const cx = lerp(STEP[i0][0], STEP[i0 + 1][0], f);
      const cy = lerp(STEP[i0][1] + 6, STEP[i0 + 1][1] + 6, f);
      const bob = done ? 0 : 2 * Math.sin(now / 220);
      drawClimber(ctx, cx, cy + bob, 1.0, done ? OK : GUIDE, done ? 'topout' : 'reach');

      drawSceneLabel(ctx, '触顶', 300, 48, done ? OK : MUTED);
      drawSceneLabel(ctx, '完攀', 300, 80, done ? OK : MUTED);

      if (done) {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = OK;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number): void => {
      render(now);
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

export default Ana8;
