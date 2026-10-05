import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawHand,
  drawKeyboard,
  drawNote,
  drawPath,
  drawSceneLabel,
  drawScore,
  GUIDE,
  LINE,
  MUTED,
  OK,
} from './musicKit';
import type { WidgetProps } from './registry';

// ana2 — 先读谱，再落键：同一个主体（手）先停在谱面上读懂，再连续地落到琴键上。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

const KEY_X = 200;
const KEY_Y = 94;
const KEY_W = 336;
const KEY_H = 34;
const WHITE = 7;
const KW = KEY_W / WHITE;

const keyCenter = (i: number): number => KEY_X + i * KW + KW / 2;

const READ_X = 110;
const READ_Y = 46;
const TARGET_I = 4;
const TIP_X = keyCenter(TARGET_I);
const TIP_Y = KEY_Y - 3;

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

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;
      const read = clamp(t / 0.3, 0, 1);
      const move = easeOutCubic(clamp((t - 0.3) / 0.32, 0, 1));
      const landed = t > 0.62;

      const bob = Math.sin(elapsed / 130) * 2.5 * (1 - move);
      const hx = lerp(READ_X, TIP_X, move);
      const hy = lerp(READ_Y + bob, TIP_Y, move);

      clearScene(ctx, W, H);
      drawPath(ctx, [[READ_X, READ_Y], [TIP_X, TIP_Y]], LINE, 1.5, [6, 6]);

      drawScore(ctx, 24, 30, 160, 24, 4, Math.max(1, Math.round(read * 4)), GUIDE);
      drawKeyboard(ctx, KEY_X, KEY_Y, KEY_W, KEY_H, WHITE, landed ? [TARGET_I] : [], GUIDE);

      if (landed) {
        const nt = clamp((t - 0.62) / 0.3, 0, 1);
        ctx.save();
        ctx.globalAlpha = 1 - nt;
        drawNote(ctx, TIP_X, lerp(KEY_Y - 18, 36, nt), 4.5, OK);
        ctx.restore();
      }

      drawHand(ctx, hx, hy, 1.05);

      drawSceneLabel(ctx, '先读谱', 24, 22, MUTED);
      drawSceneLabel(ctx, '再落键', 200, 22, landed ? OK : MUTED);
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

export default Ana2;
