import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  BALL_R,
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

// §6 analogy (560x140): the cue makes two dummy strokes behind the cue ball
// (no contact), then a third stroke really hits it and the ball rolls into the
// pocket. Purely time-driven ambient loop (3.4 s), paused off-screen by
// observeCanvas — no controls, no copy.

const W = 560;
const H = 140;
const CYCLE = 3400;
const BALL_Y = 78;
const START_BALL_X = 150;
const POCKET_X = 500;
const REST_TIP = 110;
const FORWARD_TIP = 134;
const STRIKE_TIP = 162;
const CUE_LEN = 90;
const STRIKE_START = 0.6; // two dummy strokes take the first 60% of the loop

type Phase = 'dummy' | 'strike' | 'done';

/** forward then back within one dummy stroke */
const tri = (s: number) => (s < 0.5 ? s * 2 : 2 - s * 2);

/** cue-tip position and ball progress for a loop position p in [0, 1) */
function frameAt(p: number): { tipX: number; ballT: number; phase: Phase } {
  let tipX = REST_TIP;
  let ballT = 0;
  if (p < STRIKE_START) {
    const s =
      p < STRIKE_START / 2 ? p / (STRIKE_START / 2) : (p - STRIKE_START / 2) / (STRIKE_START / 2);
    tipX = REST_TIP + tri(s) * (FORWARD_TIP - REST_TIP);
  } else {
    const s = clamp((p - STRIKE_START) / 0.22, 0, 1);
    tipX = REST_TIP + clamp(s / 0.6, 0, 1) * (STRIKE_TIP - REST_TIP);
    ballT = clamp((s - 0.4) / 0.5, 0, 1);
  }
  const phase: Phase = p < STRIKE_START ? 'dummy' : ballT >= 1 ? 'done' : 'strike';
  return { tipX, ballT, phase };
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

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
      const { tipX, ballT, phase } = frameAt((elapsed % CYCLE) / CYCLE);
      const ballX = lerp(START_BALL_X, POCKET_X, easeOutCubic(ballT));

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { bandTop: 44, bandBottom: 112, pockets: [] });
      drawAimLine(ctx, START_BALL_X, BALL_Y, POCKET_X, BALL_Y, {
        color: GUIDE,
        dashed: true,
        width: 1,
      });
      drawTargetSpot(ctx, POCKET_X, BALL_Y, 14, phase === 'done' ? 'hit' : 'idle');
      drawCue(ctx, tipX, BALL_Y, 0, CUE_LEN, { width: 6 });
      drawBall(ctx, ballX, BALL_Y, BALL_R, GUIDE);

      drawSceneLabel(ctx, '空杆试摆', 40, 16, { color: TEXT_MUTED, size: 12 });
      drawSceneLabel(ctx, '袋口', POCKET_X - 46, 16, { color: TEXT_MUTED, size: 12 });
    };

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      render(now - startRef.current);
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
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
  );
};

export default Ana6;
