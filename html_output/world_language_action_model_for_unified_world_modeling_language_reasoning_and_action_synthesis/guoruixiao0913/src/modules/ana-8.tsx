import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawCue,
  drawBall,
  drawSceneLabel,
  CUE_WOOD,
  FELT_DARK,
  GUIDE,
  TEXT,
  TEXT_MUTED,
} from './billiardsKit';

// 类比卡：手架固定不动，球杆在手架上前后滑动一次，皮头始终贴着台面高度；母球静止。
// 纯时间驱动的 ambient 循环，没有操作控件；离屏时由 observeCanvas 暂停。

const W = 560;
const H = 140;
const BAND_TOP = 56;
const BAND_BOTTOM = 104;
const MID_Y = (BAND_TOP + BAND_BOTTOM) / 2;

const BALL_X = 440;
const BRIDGE_X = 296;
const TIP_BACK = 396;
const TIP_FWD = 420;

// 一个循环：出杆 900 ms + 回杆 900 ms + 停 1000 ms，合计 2.8 s
const OUT_MS = 900;
const BACK_MS = 900;
const CYCLE_MS = 2800;

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (tipX: number) => {
      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { bandTop: BAND_TOP, bandBottom: BAND_BOTTOM, pockets: [] });

      // 母球静止
      drawBall(ctx, BALL_X, MID_Y, 10, '#ffffff');

      // 手架：稳稳支在台面上，整个动画里不动
      ctx.save();
      ctx.strokeStyle = CUE_WOOD;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(BRIDGE_X - 14, BAND_BOTTOM - 6);
      ctx.lineTo(BRIDGE_X - 2, MID_Y + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(BRIDGE_X + 14, BAND_BOTTOM - 6);
      ctx.lineTo(BRIDGE_X + 2, MID_Y + 2);
      ctx.stroke();
      ctx.fillStyle = FELT_DARK;
      ctx.fillRect(BRIDGE_X - 11, MID_Y - 3, 22, 6);
      ctx.restore();

      // 杆身沿手架滑动，皮头始终停在台面高度上
      drawCue(ctx, tipX, MID_Y, 0, 300, { tipColor: GUIDE });

      drawSceneLabel(ctx, '皮头', tipX, 28, { align: 'center', color: TEXT });
      drawSceneLabel(ctx, '手架', BRIDGE_X, 128, { align: 'center', color: TEXT_MUTED });
    };

    const t0 = performance.now();
    const tick = () => {
      const phase = (performance.now() - t0) % CYCLE_MS;
      let tipX = TIP_BACK;
      if (phase < OUT_MS) {
        tipX = lerp(TIP_BACK, TIP_FWD, easeInOutQuad(phase / OUT_MS));
      } else if (phase < OUT_MS + BACK_MS) {
        tipX = lerp(TIP_FWD, TIP_BACK, easeInOutQuad((phase - OUT_MS) / BACK_MS));
      }
      render(tipX);
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

export default Ana8;
