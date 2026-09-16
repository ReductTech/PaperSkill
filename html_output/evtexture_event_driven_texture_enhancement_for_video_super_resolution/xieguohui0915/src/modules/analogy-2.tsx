import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §8 类比：一只手捏着一枚现成的印章，往制版台上的印样上按下去，
// 印样上的网点立刻变得又大又实；松手抬起，再按一次，循环。
// 从头到尾没人在刻新版——版是现成的，印样（主干）也一直原样摊着不动，
// 只是被按了一下就涨了。

const W = 560;
const H = 140;
const LOOP_MS = 2800;

// 一次连续的按—抬：按下 36% → 贴住 16% → 抬起 48%。
// 三段首尾速度都为零，循环接缝处看不出跳变。
const DESCEND = 0.36;
const HOLD = 0.16;

// 印样：画面里唯一不动的道具，摊在制版台上。
const PRINT_X = 140;
const PRINT_Y = 82;
const PRINT_W = 280;
const PRINT_H = 36;

// 网点：底子又小又淡，被印章顶一下就变清晰。
const DOT_CELL = 12;
const DOT_R_MIN = 0.9;
const DOT_R_MAX = 2.8;
const DOT_ALPHA_MIN = 0.22;

// 印章：印体 + 顶端印柄，整体只随 bottomY 上下，和手刚性同动。
const STAMP_W = 96;
const STAMP_H = 22;
const HANDLE_W = 22;
const HANDLE_H = 13;
const CX = PRINT_X + PRINT_W / 2;
const PRESS_BOTTOM = PRINT_Y + 10; // 按到底时，印体下缘压进印样一截
const LIFT_BOTTOM = PRESS_BOTTOM - 26; // 抬起来后离印样的高度

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

/**
 * 印样上的网点图案。clarity 由 0 到 1，网点从又小又淡变成又大又实。
 * clarity 为 0 时网点并没有消失——那是主干自己的输出，一直都在。
 */
function drawHalftoneDots(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clarity: number
): void {
  const c = clamp(clarity, 0, 1);
  const r = lerp(DOT_R_MIN, DOT_R_MAX, c);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = PAPER.ink;
  ctx.globalAlpha = DOT_ALPHA_MIN + (1 - DOT_ALPHA_MIN) * c;
  for (let gy = y + DOT_CELL / 2; gy < y + h; gy += DOT_CELL) {
    for (let gx = x + DOT_CELL / 2; gx < x + w; gx += DOT_CELL) {
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * 印章。bottomY 是印体下缘的位置，印柄与刻纹都跟着它走，是一块刚体。
 * 印面下缘那一排刻纹表示这枚版早就刻好了，拿起就能用。
 */
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, bottomY: number): void {
  const left = cx - STAMP_W / 2;
  const top = bottomY - STAMP_H;
  const r = 4;

  // 印柄：手捏的地方
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - HANDLE_W / 2 + 4, top + 1);
  ctx.lineTo(cx - HANDLE_W / 2, top - HANDLE_H);
  ctx.lineTo(cx + HANDLE_W / 2, top - HANDLE_H);
  ctx.lineTo(cx + HANDLE_W / 2 - 4, top + 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 印体
  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.strokeStyle = PAPER.ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + STAMP_W - r, top);
  ctx.quadraticCurveTo(left + STAMP_W, top, left + STAMP_W, top + r);
  ctx.lineTo(left + STAMP_W, bottomY - r);
  ctx.quadraticCurveTo(left + STAMP_W, bottomY, left + STAMP_W - r, bottomY);
  ctx.lineTo(left + r, bottomY);
  ctx.quadraticCurveTo(left, bottomY, left, bottomY - r);
  ctx.lineTo(left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 印面：下缘一排现成的刻纹
  ctx.save();
  ctx.beginPath();
  ctx.rect(left + 3, bottomY - 6, STAMP_W - 6, 4);
  ctx.clip();
  ctx.fillStyle = PAPER.ink;
  for (let dx = 0; dx < STAMP_W - 6; dx += 7) {
    ctx.fillRect(left + 3 + dx, bottomY - 6, 3, 4);
  }
  ctx.restore();
  ctx.restore();
}

export const Analogy2: React.FC<WidgetProps> = () => {
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

      // 0 是抬到位，1 是压到底；整段是一气呵成的按—抬。
      const down =
        p < DESCEND
          ? easeInOutQuad(p / DESCEND)
          : p < DESCEND + HOLD
            ? 1
            : 1 - easeInOutQuad((p - DESCEND - HOLD) / (1 - DESCEND - HOLD));

      // 清晰度：印面贴上的那一瞬就跳到位（"立刻印出来"），
      // 抬起来以后才慢慢退回底子，好接下一次循环。
      const biteIn = clamp((p - 0.27) / 0.05, 0, 1);
      const biteOut = clamp((p - 0.7) / 0.18, 0, 1);
      const clarity = biteIn * (1 - biteOut);

      const stampBottom = lerp(LIFT_BOTTOM, PRESS_BOTTOM, down);

      drawPrint(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      drawHalftoneDots(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H, clarity);

      // 手与印章是一个整体，用同一个 stampBottom 驱动。
      drawStamp(ctx, CX, stampBottom);
      drawHand(ctx, CX, stampBottom - STAMP_H - HANDLE_H + 2);
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
      aria-label="一只手捏着现成的印章按到制版台的印样上，网点立刻变清晰，抬起后再按一次"
    />
  );
};

export default Analogy2;
