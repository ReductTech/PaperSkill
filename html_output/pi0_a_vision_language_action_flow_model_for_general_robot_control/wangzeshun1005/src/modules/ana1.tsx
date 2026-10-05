import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawHand,
  drawKeyboard,
  drawNote,
  drawSceneLabel,
  drawScore,
  BAD,
  EMPH,
  GUIDE,
  MUTED,
  WOOD,
} from './musicKit';
import type { WidgetProps } from './registry';

// ana1 — 一个只会弹一个音的乐手：一个主体（手）、一个动作（按同一个键）、一个目标（弹出目标音）。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

const KEY_X = 230;
const KEY_Y = 96;
const KEY_W = 310;
const KEY_H = 34;
const WHITE = 7;
const KW = KEY_W / WHITE;

const keyCenter = (i: number): number => KEY_X + i * KW + KW / 2;

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
      const switched = t > 0.55;
      const drop = clamp(t / 0.18, 0, 1);
      const tipY = lerp(30, KEY_Y - 3, easeOutCubic(drop));
      const active: number[] = drop >= 1 ? [3] : [];

      clearScene(ctx, W, H);
      drawKeyboard(ctx, KEY_X, KEY_Y, KEY_W, KEY_H, WHITE, active, switched ? MUTED : GUIDE);

      if (switched) {
        ctx.save();
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 3;
        ctx.strokeRect(keyCenter(5) - KW / 2 + 3, KEY_Y - 5, KW - 8, KEY_H + 10);
        ctx.restore();
      }

      if (drop >= 1 && !switched) {
        const nt = clamp((t - 0.18) / 0.32, 0, 1);
        ctx.save();
        ctx.globalAlpha = 1 - nt;
        drawNote(ctx, keyCenter(3), lerp(KEY_Y - 18, 36, nt), 4.5, GUIDE);
        ctx.restore();
      }

      drawHand(ctx, keyCenter(3), tipY, 1.05, switched ? BAD : WOOD);

      drawScore(ctx, 20, 34, 170, 22, 4, switched ? 3 : 1, switched ? EMPH : GUIDE);
      drawSceneLabel(ctx, '只会一个键', 20, 24, MUTED);
      drawSceneLabel(ctx, '换个新曲子', 20, 84, switched ? BAD : MUTED);
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
