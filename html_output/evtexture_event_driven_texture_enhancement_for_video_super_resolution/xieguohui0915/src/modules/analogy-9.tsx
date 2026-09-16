import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, drawStripes, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §9 类比：一只手捏着套准十字标记从左上角移到印样的十字上按住，
// 两个十字重合、边缘对齐；保持半秒后松手退回。

const W = 560;
const H = 140;
const LOOP_MS = 3000;

const PRINT_X = 40;
const PRINT_Y = 38;
const PRINT_W = 480;
const PRINT_H = 66;
const TARGET_X = 300;
const TARGET_Y = 71;
const START_X = 100;
const START_Y = 52;
const MOVE_END = 0.52;
const HOLD_END = 0.74;

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

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 11, y);
  ctx.lineTo(x + 11, y);
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y + 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const Analogy9: React.FC<WidgetProps> = () => {
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

      const move = easeInOutQuad(clamp(p / MOVE_END, 0, 1));
      const back = easeInOutQuad(clamp((p - HOLD_END) / (1 - HOLD_END), 0, 1));
      const k = move * (1 - back);
      const cx = lerp(START_X, TARGET_X, k);
      const cy = lerp(START_Y, TARGET_Y, k);

      drawPrint(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      drawStripes(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H, 16, { contrast: 1 });

      // 十字没压准之前，印样上的边缘是错开的：重影随误差一起消失
      const errX = (cx - TARGET_X) * 0.16;
      const errY = (cy - TARGET_Y) * 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      ctx.clip();
      ctx.globalAlpha = 0.42;
      ctx.translate(errX, errY);
      drawStripes(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H, 16, { contrast: 1 });
      ctx.restore();

      drawCross(ctx, TARGET_X, TARGET_Y, PAPER.muted);
      drawCross(ctx, cx, cy, PAPER.blue);
      drawHand(ctx, cx + 20, cy - 16);
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
      aria-label="手把套准十字标记移到印样的十字上，两个十字重合后边缘对齐"
    />
  );
};

export default Analogy9;
