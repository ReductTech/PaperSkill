import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPrint, drawStripes, drawRegisterKnob, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §3 类比：一只手转动制版台上的套准旋钮，细指针来回摆，
// 第二张印样随之微移，叠出的图案在清晰与重影之间反复。

const W = 560;
const H = 140;
const LOOP_MS = 3200;

const PRINT_X = 180;
const PRINT_Y = 38;
const PRINT_W = 340;
const PRINT_H = 66;
const KNOB_X = 86;
const KNOB_Y = 70;
const KNOB_R = 30;

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

export const Analogy3: React.FC<WidgetProps> = () => {
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

      // 旋钮来回转，第二张印样跟着左右微移
      const swing = Math.sin(p * Math.PI * 2);
      const dx = swing * 7;

      drawPrint(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      drawStripes(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H, 16, { contrast: 1 });

      // 叠上去的第二张印样：错开一点就是双影
      ctx.save();
      ctx.globalAlpha = 0.5;
      drawStripes(ctx, PRINT_X + dx, PRINT_Y, PRINT_W, PRINT_H, 16, { contrast: 1 });
      ctx.restore();

      drawRegisterKnob(ctx, KNOB_X, KNOB_Y, KNOB_R, swing * 0.6, PAPER.orange);
      drawHand(ctx, KNOB_X + 18, KNOB_Y - 28);
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
      aria-label="手转套准旋钮，第二张印样微移，叠合图案在清晰与重影之间反复"
    />
  );
};

export default Analogy3;
