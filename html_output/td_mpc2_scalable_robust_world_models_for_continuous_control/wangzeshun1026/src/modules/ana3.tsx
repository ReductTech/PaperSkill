import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { clearScene, drawTable, drawBall, drawCue, drawPocket, drawSceneLabel, GUIDE, OK, EMPH, AUX, INK, MUTED } from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻 3：上场前把五件装备依次检查一遍，再出杆。
// 一根球杆上的五段色带逐一点亮，随后白球入袋。自动循环 3.2s。

const W = 560;
const H = 140;
const DUR = 3200;
const R = 8;
const BALL_X = 446;
const POCKET = { x: 506, y: 64 };
const BANDS = [150, 196, 242, 288, 334];
const BAND_COLORS = [GUIDE, OK, EMPH, AUX, INK];

function render(ctx: CanvasRenderingContext2D, t: number): void {
  clearScene(ctx, W, H);
  drawTable(ctx, 24, 16, 512, 92);

  drawCue(ctx, BALL_X, 64, 0, 320);

  for (let i = 0; i < BANDS.length; i++) {
    const lit = t > 0.05 + i * 0.085;
    const x = BANDS[i];
    if (lit) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = BAND_COLORS[i];
      ctx.fillRect(x - 6, 51, 12, 26);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = lit ? 1 : 0.45;
    ctx.fillStyle = lit ? BAND_COLORS[i] : MUTED;
    ctx.fillRect(x - 3, 56, 6, 16);
    ctx.globalAlpha = 1;
  }

  const travel = clamp((t - 0.5) / 0.34, 0, 1);
  const eased = travel * travel * (3 - 2 * travel);
  drawBall(ctx, lerp(BALL_X, 500, eased), 64, R, '#f3f0e4', true);

  drawPocket(ctx, POCKET.x, POCKET.y, 11);
  drawSceneLabel(ctx, '五件装备', 36, 36, INK);
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

export default Ana3;
