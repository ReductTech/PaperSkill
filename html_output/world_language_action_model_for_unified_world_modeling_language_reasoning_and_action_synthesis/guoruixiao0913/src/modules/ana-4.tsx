import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerp } from '../lib/canvasKit';
import {
  FELT,
  FELT_DARK,
  GUIDE,
  SUCCESS,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawBall,
  drawSceneLabel,
  drawTable,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 类比卡 560×140：母球从右侧出发，滚过台面后停在橙色圆环内，圆环由灰变绿；
// 靶球静止在旁作静态道具。环境循环 3.2 s（2.4 s 滚动 + 0.8 s 停留）。

const W = 560;
const H = 140;
const BAND_TOP = 40;
const BAND_BOTTOM = 108;
const BALL_Y = 74;
const START_X = 470;
const SPOT_X = 170;
const PROP_X = 360;
const PROP_Y = 94;
const LOOP_MS = 3200;
const TRAVEL_MS = 2400;

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const local = elapsed % LOOP_MS;
      const travel = easeOutCubic(clamp(local / TRAVEL_MS, 0, 1));
      const arrived = local >= TRAVEL_MS;
      const ballX = lerp(START_X, SPOT_X, travel);

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [60, 500], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });
      drawAimLine(ctx, START_X, BALL_Y, SPOT_X + 26, BALL_Y, {
        color: TEXT_MUTED,
        dashed: true,
      });
      // 目标停球点的圆环：未到时灰，停进环内转绿
      drawBall(ctx, SPOT_X, BALL_Y, 13, FELT, {
        ring: arrived ? SUCCESS : TEXT_MUTED,
      });
      drawBall(ctx, PROP_X, PROP_Y, 10, FELT_DARK);
      drawBall(ctx, ballX, BALL_Y, 10, GUIDE);
      drawSceneLabel(ctx, '停球点', SPOT_X, 22, { align: 'center', color: TEXT_MUTED });
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

export default Ana4;
