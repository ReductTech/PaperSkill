import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  EMPHASIS,
  FELT_DARK,
  GUIDE,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawBall,
  drawCue,
  drawSceneLabel,
  drawTable,
  drawTargetSpot,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 类比卡 560×140：球杆沿瞄准线前后推拉一次（试杆），杆头始终指向袋口方向，
// 母球与靶球保持不动。环境循环 3.0 s，不接收交互状态。

const W = 560;
const H = 140;
const BAND_TOP = 40;
const BAND_BOTTOM = 108;
const BALL_Y = 74;
const CUE_BALL_X = 200;
const OBJ_BALL_X = 340;
const POCKET_X = 500;
const LOOP_MS = 3000;

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

    const render = (elapsed: number) => {
      const phase = (elapsed % LOOP_MS) / LOOP_MS;
      // 一次完整来回：18 px（贴球）→ 58 px（拉杆）→ 18 px
      const pullBack = 38 - 20 * Math.cos(phase * Math.PI * 2);
      const tipX = CUE_BALL_X - pullBack;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });
      drawAimLine(ctx, CUE_BALL_X, BALL_Y, POCKET_X - 16, BALL_Y, { dashed: true });
      drawTargetSpot(ctx, POCKET_X, BALL_Y, 14, 'idle');
      drawBall(ctx, OBJ_BALL_X, BALL_Y, 10, FELT_DARK);
      drawBall(ctx, CUE_BALL_X, BALL_Y, 10, GUIDE);
      drawCue(ctx, tipX, BALL_Y, 0, 130, { tipColor: EMPHASIS });
      drawSceneLabel(ctx, '瞄准线', 56, 22, { color: TEXT_MUTED });
    };

    const tick = () => {
      render(performance.now());
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana3;
