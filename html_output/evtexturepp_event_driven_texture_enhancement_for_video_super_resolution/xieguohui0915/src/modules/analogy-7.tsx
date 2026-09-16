import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, drawDial, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §7 类比：一只手握着墨辊在印版上来回滚。画面上只有墨辊一个自己在动的东西，
// 旁边的计时器指针平时完全静止，只在墨辊走完一个完整来回的那一刻跳一格——
// 训练就是把同一批样本一遍又一遍地滚过去，滚完一遍才计入一次迭代。

const W = 560;
const H = 140;
const LOOP_MS = 2800;

const TRIPS = 5; // 一个循环里墨辊走 5 个完整来回
const MARKS = 5; // 表盘 5 格，每个来回恰好前进一格

const PLATE_X = 44;
const PLATE_Y = 72;
const PLATE_W = 276;
const PLATE_H = 40;

const ROLLER_W = 46;
const ROLLER_H = 24;
const ROLLER_TOP = PLATE_Y - ROLLER_H - 1; // 辊面正好压在印版上
const TRAVEL_MIN = PLATE_X + 34;
const TRAVEL_MAX = PLATE_X + PLATE_W - 34;

const DIAL_X = 462;
const DIAL_Y = 64;
const DIAL_R = 40;

/** 简笔手：以 (x, y) 为捏合点，手向斜上方伸出。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PAPER.ink;
  ctx.fillStyle = 'rgba(255,253,246,0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y - 16, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 18);
  ctx.quadraticCurveTo(x - 7, y - 8, x - 2, y - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 11, y - 18);
  ctx.quadraticCurveTo(x + 7, y - 8, x + 2, y - 1);
  ctx.stroke();
  ctx.restore();
}

/** 墨辊：一根手柄 + 圆角辊体，手柄顶端接着手。整体随 cx 平移。 */
function drawRoller(ctx: CanvasRenderingContext2D, cx: number): void {
  const x = cx - ROLLER_W / 2;
  const top = ROLLER_TOP;
  const r = 7;

  ctx.save();
  ctx.strokeStyle = PAPER.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, top + 2);
  ctx.lineTo(cx + 14, top - 12);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.tableShadow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + r, top);
  ctx.lineTo(x + ROLLER_W - r, top);
  ctx.quadraticCurveTo(x + ROLLER_W, top, x + ROLLER_W, top + r);
  ctx.lineTo(x + ROLLER_W, top + ROLLER_H - r);
  ctx.quadraticCurveTo(x + ROLLER_W, top + ROLLER_H, x + ROLLER_W - r, top + ROLLER_H);
  ctx.lineTo(x + r, top + ROLLER_H);
  ctx.quadraticCurveTo(x, top + ROLLER_H, x, top + ROLLER_H - r);
  ctx.lineTo(x, top + r);
  ctx.quadraticCurveTo(x, top, x + r, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 辊体中间的一道墨带
  ctx.fillStyle = 'rgba(33,50,74,0.16)';
  ctx.fillRect(x + 6, top + 7, ROLLER_W - 12, ROLLER_H - 14);
  ctx.restore();

  drawHand(ctx, cx + 14, top - 12);
}

export const Analogy7: React.FC<WidgetProps> = () => {
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

    const render = (p: number) => {
      clearScene(ctx, W, H);

      // 一个循环切成 TRIPS 段，每段是一次完整的来回：左 → 右 → 左。
      const tripsF = p * TRIPS;
      const trip = Math.floor(tripsF);
      const q = clamp(tripsF - trip, 0, 1);
      const swing = q < 0.5 ? easeInOutQuad(q * 2) : easeInOutQuad((1 - q) * 2);
      const cx = lerp(TRAVEL_MIN, TRAVEL_MAX, swing);

      // 指针不去插值：只有墨辊回到起点、一个来回真正走完的那一刻才跳一格。
      const needle = clamp(trip, 0, MARKS - 1);

      drawPrint(ctx, PLATE_X, PLATE_Y, PLATE_W, PLATE_H);
      drawRoller(ctx, cx);
      drawDial(ctx, DIAL_X, DIAL_Y, DIAL_R, MARKS, needle, PAPER.orange);
    };

    const tick = () => {
      render((performance.now() % LOOP_MS) / LOOP_MS);
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
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="一只手握着墨辊在印版上来回滚，计时器指针每走完一个完整来回跳一格"
    />
  );
};

export default Analogy7;
