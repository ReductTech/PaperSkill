import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawBall,
  drawSceneLabel,
  GUIDE,
  CUE_WOOD,
  BORDER,
} from './billiardsKit';

// §2 类比卡 (560×140) — 先把手架和母球摆好。
// 一只手把母球沿台呢轻推到起始点，浅色圆环标出起始位；随后手退回手架位置不再移动，
// 球停在环内不再移动。环境动画：3.0 s 一轮（推球 + 收手 + 停住），无控件。

const W = 560;
const H = 140;
const BAND_TOP = 48;
const BAND_BOTTOM = 116;
const MID = (BAND_TOP + BAND_BOTTOM) / 2;
const HAND_FROM = 176;
const HAND_TO = 282;
const HAND_REST = 150;
const BALL_OFFSET = 18;
const SPOT_X = 300;
const LOOP_MS = 3000;

/** 手架：手掌 + 三根手指，统一用球杆/手架色 CUE_WOOD。 */
function drawHand(ctx: CanvasRenderingContext2D, hx: number, hy: number): void {
  ctx.save();
  ctx.fillStyle = CUE_WOOD;
  ctx.strokeStyle = CUE_WOOD;
  ctx.lineCap = 'round';
  // 三根手指（朝右，轻轻贴住母球左侧）
  for (let i = -1; i <= 1; i++) {
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy + i * 7);
    ctx.lineTo(hx + 6, hy + i * 7);
    ctx.stroke();
  }
  // 手掌
  ctx.beginPath();
  ctx.ellipse(hx - 18, hy + 4, 16, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ana2: React.FC<WidgetProps> = () => {
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
      const phase = (performance.now() % LOOP_MS) / LOOP_MS;
      // 0–0.5 推球；0.5–0.78 手退回手架位；之后全部静止。
      const push = easeOutCubic(clamp(phase / 0.5, 0, 1));
      const back = easeOutCubic(clamp((phase - 0.5) / 0.28, 0, 1));
      const handX = phase < 0.5 ? lerp(HAND_FROM, HAND_TO, push) : lerp(HAND_TO, HAND_REST, back);
      // 球被推到起始位后就不再移动（手收回时球停在环内）。
      const ballX = phase < 0.5 ? handX + BALL_OFFSET : SPOT_X;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 起始位：浅色圆环标出母球该停的地方。
      ctx.save();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SPOT_X, MID, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 母球与推它的手。
      drawBall(ctx, ballX, MID, 10, GUIDE);
      drawHand(ctx, handX, MID);

      drawSceneLabel(ctx, '手架', HAND_REST, 22, { align: 'center' });
      drawSceneLabel(ctx, '起始位', SPOT_X, 106, { align: 'center' });
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

export default Ana2;
