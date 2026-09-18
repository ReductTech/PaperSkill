import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  drawAimLine,
  drawTargetSpot,
  GUIDE,
  FELT_DARK,
} from './billiardsKit';

// §10 analogy card (560×140) — 清台收官。
// 纯时间驱动的环境循环（3.4 s），没有任何控件与操作提示：
// 母球把最后一颗靶球推进左侧角袋，母球停在台面中央的橙色停球环里，
// 球杆随后从画面右侧缓缓收回；收杆后画面淡出、再从头浮现，无缝进入下一轮。
// 离屏时由 observeCanvas 暂停。

const W = 560;
const H = 140;
const BAND_TOP = 58;
const BAND_BOTTOM = 96;
const MID_Y = (BAND_TOP + BAND_BOTTOM) / 2;
const POCKET_X = 60;
const POCKET_Y = 54;
const TARGET_START = 250;
const TARGET_END = 74;
const CUE_START = 390;
const CUE_END = 300;
const TIP_REST = 415;
const TIP_JAB = 400;
const TIP_RETRACT = 512;
const T_HIT = 0.16;
const T_SINK = 0.6;
const T_RETRACT = 0.62;
const LOOP_SECONDS = 3.4;
/** 循环开始的一小段用于浮现 */
const FADE_IN = 0.06;
/** 到 0.86 之前保持完整画面，之后淡出 */
const FADE_OUT = 0.86;

interface Scene {
  /** 环境循环相位 0→1 */
  phase: number;
}

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<Scene>({ phase: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const renderScene = (c: CanvasRenderingContext2D, s: Scene) => {
      const u = clamp(s.phase, 0, 1);
      const fade = u < FADE_IN ? u / FADE_IN : u > FADE_OUT ? clamp((1 - u) / (1 - FADE_OUT), 0, 1) : 1;
      const t = clamp((u - FADE_IN) / (FADE_OUT - FADE_IN), 0, 1);

      clearScene(c, W, H);
      drawTable(c, W, H, {
        bandTop: BAND_TOP,
        bandBottom: BAND_BOTTOM,
        pockets: [POCKET_X],
      });

      // 母球走位线（示意）
      drawAimLine(c, CUE_START, MID_Y, CUE_END, MID_Y, { color: GUIDE, dashed: true, width: 1 });

      // 球杆：先一小段前推，后半段缓缓从右侧收回
      let tipX = TIP_JAB;
      if (t < T_HIT) tipX = lerp(TIP_REST, TIP_JAB, easeOutCubic(t / T_HIT));
      else if (t > T_RETRACT) {
        tipX = lerp(TIP_JAB, TIP_RETRACT, easeOutCubic(clamp((t - T_RETRACT) / (1 - T_RETRACT), 0, 1)));
      }

      // 母球：被击出后减速，停在台面中央的停球环里
      const cueBallX =
        t <= T_HIT
          ? CUE_START
          : lerp(CUE_START, CUE_END, easeOutCubic(clamp((t - T_HIT) / 0.34, 0, 1)));

      // 靶球：滚向角袋，最后在袋口淡出
      const travel = easeOutCubic(clamp((t - T_HIT) / (T_SINK - T_HIT), 0, 1));
      const sink = clamp((t - T_SINK) / 0.28, 0, 1);
      const targetX = lerp(lerp(TARGET_START, TARGET_END, travel), POCKET_X, sink);
      const targetY = lerp(MID_Y, POCKET_Y, sink);

      c.save();
      c.globalAlpha = clamp(fade, 0, 1);
      drawTargetSpot(c, POCKET_X, POCKET_Y, 14, sink > 0.85 ? 'hit' : 'idle');
      drawTargetSpot(c, CUE_END, MID_Y, 16, t >= T_HIT + 0.34 ? 'hit' : 'idle');
      drawCue(c, tipX, MID_Y, Math.PI, 200, { tipColor: GUIDE, width: 7 });
      c.restore();

      c.save();
      c.globalAlpha = clamp(fade * (1 - 0.85 * sink), 0, 1);
      drawBall(c, targetX, targetY, 10, FELT_DARK);
      c.restore();

      c.save();
      c.globalAlpha = clamp(fade, 0, 1);
      drawBall(c, cueBallX, MID_Y, 10, GUIDE);
      c.restore();
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const s = stateRef.current;
      s.phase = (s.phase + dt / LOOP_SECONDS) % 1;

      renderScene(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    start();
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

export default Ana10;
