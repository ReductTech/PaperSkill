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
  FAIL,
} from './billiardsKit';

// Hero 左侧（传统方法，560×140）— 世界-动作模型只预测下一帧画面。
// 母球被推出后，画面里只追着「最像的那一帧」走；靶球一路漂出袋口外，轨迹为红色虚线。
// 与 hero-new 共用同一时间基（2.8 s 动画 + 1.6 s 停住，循环）。

const W = 560;
const H = 140;
const BAND_TOP = 48;
const BAND_BOTTOM = 116;
const MID = (BAND_TOP + BAND_BOTTOM) / 2;
const POCKET_X = 468;
const CUE_START = 96;
const ANIM_MS = 2800;
const HOLD_MS = 1600;
const PERIOD_MS = ANIM_MS + HOLD_MS;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      const phase = performance.now() % PERIOD_MS;
      const p = clamp(phase / ANIM_MS, 0, 1);
      const e = easeOutCubic(p);

      // 只追画面：靶球一路漂出袋口，轨迹始终是红色虚线。
      const cueX = lerp(CUE_START, 300, e);
      const targetX = lerp(404, 332, e);
      const targetY = lerp(MID, 58, e);

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 红色虚线：这一杆的路线。
      drawAimLine(ctx, CUE_START, MID, targetX, targetY, { color: FAIL, dashed: true });
      // 袋口的目标环没能被填上：红环留在原地。
      drawTargetSpot(ctx, POCKET_X, MID, 14, 'miss');
      // 漂出袋口的靶球（红色虚线环）。
      drawBall(ctx, targetX, targetY, 9, FELT_DARK, { ring: FAIL, dashed: true });
      // 母球。
      drawBall(ctx, cueX, MID, 10, GUIDE);

      drawSceneLabel(ctx, '靶球漂出', 84, 22);
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

export default HeroOld;
