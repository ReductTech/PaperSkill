import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawCue,
  drawBall,
  drawAimLine,
  drawTargetSpot,
  drawSceneLabel,
  GUIDE,
  SUCCESS,
  TEXT,
  TEXT_MUTED,
} from './billiardsKit';

// 类比卡：同一个球位重复练三次，落点一次比一次靠近目标环。
// 纯时间驱动的 ambient 循环，没有操作控件；离屏时由 observeCanvas 暂停。

const W = 560;
const H = 140;
const BAND_TOP = 56;
const BAND_BOTTOM = 104;
const MID_Y = (BAND_TOP + BAND_BOTTOM) / 2;

const START_X = 86;
const START_Y = MID_Y + 14;
const RING_X = 410;
const RING_R = 16;

// 三次重复练习的落点：前两次偏出目标环（灰色），第三次落进环内（绿色）
const LANDINGS = [
  { x: 352, hit: false },
  { x: 378, hit: false },
  { x: RING_X, hit: true },
];

const STROKE_MS = 1100; // 一次练习
const CYCLE_MS = STROKE_MS * LANDINGS.length; // 整个循环 3.3 s

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (repeat: number, t: number) => {
      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { bandTop: BAND_TOP, bandBottom: BAND_BOTTOM, pockets: [500] });

      const landing = LANDINGS[repeat];

      // 已经练过的落点淡淡留在台面上，看得出「一次比一次靠近」
      for (let i = 0; i < repeat; i += 1) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawBall(ctx, LANDINGS[i].x, MID_Y, 8, TEXT_MUTED);
        ctx.restore();
      }

      drawTargetSpot(ctx, RING_X, MID_Y, RING_R, repeat === 2 && t > 0.6 ? 'hit' : 'idle');

      const dir = Math.atan2(MID_Y - START_Y, landing.x - START_X);
      drawAimLine(ctx, START_X, START_Y, landing.x, MID_Y, { color: GUIDE, width: 1.5 });
      drawCue(ctx, START_X - Math.cos(dir) * 16, START_Y - Math.sin(dir) * 16, dir, 170, {
        tipColor: GUIDE,
      });

      // 母球每次都从左下角重新出发，滚向这一次的落点
      const p = clamp(t, 0, 1);
      drawBall(
        ctx,
        lerp(START_X, landing.x, easeOutCubic(p)),
        lerp(START_Y, MID_Y, easeOutCubic(p)),
        10,
        landing.hit ? SUCCESS : TEXT_MUTED,
      );

      drawSceneLabel(ctx, '目标环', RING_X, 26, { align: 'center', color: TEXT_MUTED });
      drawSceneLabel(ctx, '母球', START_X, 128, { align: 'center', color: TEXT });
    };

    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      const repeat = Math.floor(elapsed / STROKE_MS) % LANDINGS.length;
      render(repeat, (elapsed % CYCLE_MS) / STROKE_MS);
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

export default Ana7;
