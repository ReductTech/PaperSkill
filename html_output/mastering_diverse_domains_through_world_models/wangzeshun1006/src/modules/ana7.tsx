import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawRope,
  drawSceneLabel,
  GUIDE,
  OK,
  BAD,
  EMPH,
  HOLD,
  INK,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana7 — 回放录像，重复练同一段。
// 一块小屏幕反复播放刚爬过的动作（蓝色小人重复上移），攀岩者在屏幕前倒回进度条、
// 暂停、再做一遍。自动循环，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3200;

const SCR_X = 30;
const SCR_Y = 16;
const SCR_W = 220;
const SCR_H = 100;

const HOLDS: number[][] = [
  [88, 98],
  [128, 82],
  [168, 62],
  [204, 44],
];

const head = (t: number): number => {
  if (t < 0.5) return easeOutCubic(clamp(t / 0.5, 0, 1));
  if (t < 0.75) return 1;
  if (t < 0.92) return 1 - (t - 0.75) / 0.17;
  return 0;
};

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
    const t0 = performance.now();

    const render = (now: number): void => {
      const t = ((now - t0) % DUR) / DUR;
      clearCrag(ctx, W, H);

      // 屏幕外框
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(SCR_X, SCR_Y, SCR_W, SCR_H);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(SCR_X, SCR_Y, SCR_W, SCR_H);

      // 屏幕里的墙与线路
      drawWall(ctx, SCR_X + 8, SCR_Y + 8, SCR_W - 16, SCR_H - 16);
      const route: number[][] = HOLDS.map((p) => [p[0], p[1]]);
      ctx.save();
      ctx.setLineDash([6, 6]);
      drawRope(ctx, route, GUIDE, 2);
      ctx.restore();

      // 屏幕里的攀岩者：重复上移
      const climb = head(t);
      const sx = lerp(HOLDS[0][0], HOLDS[HOLDS.length - 1][0], climb);
      const sy = lerp(HOLDS[0][1] + 4, HOLDS[HOLDS.length - 1][1] + 4, climb);
      for (let i = 0; i < HOLDS.length; i++) {
        const lit = climb >= (i + 0.5) / HOLDS.length;
        drawHold(ctx, HOLDS[i][0], HOLDS[i][1], 5, lit ? OK : HOLD, lit);
      }
      drawClimber(ctx, sx, sy, 0.42, GUIDE, 'reach');

      // 进度条 + 倒回播放头
      const barY = SCR_Y + SCR_H + 10;
      const barX = SCR_X + 14;
      const barW = SCR_W - 28;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + barW, barY);
      ctx.stroke();
      ctx.strokeStyle = GUIDE;
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + barW * clamp(climb, 0, 1), barY);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(barX + barW * clamp(head(t), 0, 1), barY, 6, 0, Math.PI * 2);
      ctx.fill();

      // 屏幕前的攀岩者：暂停、再练一次
      const redoing = t >= 0.5 && t < 0.92;
      const bob = 2.5 * Math.sin(now / 260);
      drawClimber(ctx, 430, 118 + bob, 1.05, MUTED, 'reach');
      if (redoing) {
        ctx.fillStyle = EMPH;
        ctx.beginPath();
        ctx.arc(430, 64, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = BAD;
        ctx.fillRect(410, 78, 40, 6);
      }

      drawSceneLabel(ctx, '录像回放', 300, 44, INK);
      drawSceneLabel(ctx, '重放缓冲', 300, 76, EMPH);

      ctx.globalAlpha = 0.05;
      ctx.fillStyle = redoing ? EMPH : OK;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
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
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana7;
