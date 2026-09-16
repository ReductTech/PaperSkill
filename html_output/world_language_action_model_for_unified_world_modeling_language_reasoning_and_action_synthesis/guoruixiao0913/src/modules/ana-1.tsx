import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawBall,
  drawAimLine,
  drawTargetSpot,
  drawSceneLabel,
  GUIDE,
  FELT_DARK,
} from './billiardsKit';

// §1 类比卡 (560×140) — 先看清这一杆要干什么。
// 母球从台面左侧被推出，沿蓝色实线滚向右侧角袋；进袋前速度略降，最后停在袋口内。
// 靶球静止在远端，只作静态道具。环境动画：3.0 s 一轮（行程 + 停住），无控件。

const W = 560;
const H = 140;
const BAND_TOP = 48;
const BAND_BOTTOM = 116;
const MID = (BAND_TOP + BAND_BOTTOM) / 2;
const POCKET_X = 468;
const CUE_START = 96;
const PROP_X = 370;
const LOOP_MS = 3000;

export const Ana1: React.FC<WidgetProps> = () => {
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

    const render = () => {
      // 一轮动画：0–0.72 母球滚向袋口，之后停在袋口内。
      const phase = (performance.now() % LOOP_MS) / LOOP_MS;
      const cueX = lerp(CUE_START, POCKET_X, easeOutCubic(clamp(phase / 0.72, 0, 1)));

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 目标袋口：深绿描边，始终是这一杆的唯一目标。
      drawTargetSpot(ctx, POCKET_X, MID, 14, 'hit');
      // 蓝色实线 = 这一杆已经看清的路线。
      drawAimLine(ctx, CUE_START, MID, cueX, MID, { color: GUIDE, width: 1.5 });
      // 远端靶球：静态道具，提示这一杆之后局面还要继续。
      drawBall(ctx, PROP_X, MID + 19, 9, FELT_DARK);
      // 母球。
      drawBall(ctx, cueX, MID, 10, GUIDE);

      drawSceneLabel(ctx, '瞄准线', 84, 22);
      drawSceneLabel(ctx, '目标袋口', POCKET_X, 106, { align: 'center' });
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
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
      <canvas ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana1;
