import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, drawStripes, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §8 类比：一只手捏着半透明的纹理补片从右上角移到印样正上方按住，
// 补片细线与印样对齐后画面变清晰；保持一秒后松手退回。

const W = 560;
const H = 140;
const LOOP_MS = 3600;

const PRINT_X = 40;
const PRINT_Y = 38;
const PRINT_W = 480;
const PRINT_H = 66;
const PATCH_W = 180;
const PATCH_H = 74;
const PATCH_START_X = 348;
const PATCH_START_Y = 24;
const PATCH_TARGET_X = 190;
const PATCH_TARGET_Y = 34;
const CELL = 16;
const MOVE_END = 0.55;
const HOLD_END = 0.82;

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

export const Analogy8: React.FC<WidgetProps> = () => {
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
      const land = move * (1 - back);
      const px = lerp(PATCH_START_X, PATCH_TARGET_X, land);
      const py = lerp(PATCH_START_Y, PATCH_TARGET_Y, land);

      drawPrint(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      // 补片没压准之前，印样上的纹理是糊的
      drawStripes(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H, CELL, {
        contrast: lerp(0.28, 1, land),
      });

      // 纹理补片：与印样同格距、同相位，压到位才严丝合缝
      ctx.save();
      ctx.globalAlpha = 0.62;
      drawStripes(ctx, px, py, PATCH_W, PATCH_H, CELL, { contrast: 0.8 });
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = PAPER.purple;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, PATCH_W - 2, PATCH_H - 2);
      ctx.restore();

      drawHand(ctx, px + PATCH_W - 16, py + 6);
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
      aria-label="手把纹理补片从右上角移到印样上按住，对齐后画面变清晰"
    />
  );
};

export default Analogy8;
