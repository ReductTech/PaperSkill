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
  EMPHASIS,
  SUCCESS,
} from './billiardsKit';

// Hero 右侧（本文方法，560×140）— WLA 同时给出文本意图与物理动力学。
// 先出现一条蓝色瞄准线（意图），再出现一条橙色走位线（动力学）；
// 靶球落进袋口、母球停在目标环内，落点转绿。
// 与 hero-old 共用同一时间基（2.8 s 动画 + 1.6 s 停住，循环）。

const W = 560;
const H = 140;
const BAND_TOP = 48;
const BAND_BOTTOM = 116;
const MID = (BAND_TOP + BAND_BOTTOM) / 2;
const POCKET_X = 468;
const CUE_START = 96;
const CONTACT_X = 374;
const PARK_X = 286;
const PARK_Y = 100;
const TARGET_START = 404;
const AIM_END = 0.45;
const RUN_START = 0.62;
const DONE = 0.96;
const ANIM_MS = 2800;
const HOLD_MS = 1600;
const PERIOD_MS = ANIM_MS + HOLD_MS;

export const HeroNew: React.FC<WidgetProps> = () => {
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

      // 第一段：蓝色瞄准线先长出来（意图）。
      const aimP = easeOutCubic(clamp(p / AIM_END, 0, 1));
      // 第二段：母球被击出（动力学），靶球进袋，母球退到目标停球点。
      const runP = easeOutCubic(clamp((p - RUN_START) / (1 - RUN_START), 0, 1));
      const cueX =
        p < RUN_START ? lerp(CUE_START, CONTACT_X, easeOutCubic(clamp(p / RUN_START, 0, 1))) : lerp(CONTACT_X, PARK_X, runP);
      const cueY = p < RUN_START ? MID : lerp(MID, PARK_Y, runP);
      const targetX = lerp(TARGET_START, POCKET_X, runP);
      const settled = p >= DONE;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 蓝色瞄准线 = 文本意图：这一杆要打哪一个袋口。
      drawAimLine(ctx, CUE_START, MID, lerp(CUE_START, POCKET_X, aimP), MID, {
        color: GUIDE,
        dashed: !settled,
        width: 1.5,
      });
      // 橙色走位线 = 物理动力学：母球该停在哪儿。
      if (p > RUN_START) {
        drawAimLine(ctx, CONTACT_X, MID, cueX, cueY, { color: EMPHASIS, dashed: true });
      }
      // 目标袋口：进袋后转绿。
      drawTargetSpot(ctx, POCKET_X, MID, 14, settled ? 'hit' : 'idle');
      // 母球的目标停球点：到位后转绿。
      drawTargetSpot(ctx, PARK_X, PARK_Y, 15, settled ? 'hit' : 'idle');
      // 靶球落进袋口。
      drawBall(ctx, targetX, MID, 9, FELT_DARK, { ring: settled ? SUCCESS : undefined });
      // 母球停进目标环。
      drawBall(ctx, cueX, cueY, 10, GUIDE, { ring: settled ? SUCCESS : undefined });

      drawSceneLabel(ctx, '瞄准线', 84, 22);
      drawSceneLabel(ctx, '走位线', 300, 22);
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

export default HeroNew;
