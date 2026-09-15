import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, drawScreen, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §1 类比：一只手捏着网点网屏在印样上从左向右滑过。
// 经过之处条纹先是完好，到了过密处立刻塌成均匀灰。

const W = 560;
const H = 140;
const LOOP_MS = 3000;

const PRINT_X = 40;
const PRINT_Y = 38;
const PRINT_W = 480;
const PRINT_H = 66;
const SHEET_W = 150;
const PERIOD_COARSE = 14;
const PERIOD_FINE = 3.2;
const COLLAPSE_PERIOD = 7;
const FLAT_GREY = '#8d9198';

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

/** 印样上的条纹从左到右由疏到密。 */
function localPeriod(px: number): number {
  return lerp(PERIOD_COARSE, PERIOD_FINE, px / PRINT_W);
}

export const Analogy1: React.FC<WidgetProps> = () => {
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
      drawPrint(ctx, PRINT_X, PRINT_Y, PRINT_W, PRINT_H);

      const sheetX = lerp(PRINT_X - SHEET_W, PRINT_X + PRINT_W, easeInOutQuad(p));
      const front = clamp(sheetX, PRINT_X, PRINT_X + PRINT_W);

      ctx.save();
      ctx.beginPath();
      ctx.rect(PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      ctx.clip();
      // 连续调的疏密条纹
      for (let px = 0; px < PRINT_W; px++) {
        const period = localPeriod(px);
        const v = Math.sin((px / period) * Math.PI * 2);
        const g = Math.round(255 - ((v + 1) / 2) * 255);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(PRINT_X + px, PRINT_Y, 1.2, PRINT_H);
      }
      // 网屏扫过的地方：过密处塌成均匀灰
      for (let px = 0; px < front - PRINT_X; px++) {
        if (localPeriod(px) < COLLAPSE_PERIOD) {
          ctx.fillStyle = FLAT_GREY;
          ctx.fillRect(PRINT_X + px, PRINT_Y, 1.2, PRINT_H);
        }
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = PAPER.printEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(PRINT_X + 0.5, PRINT_Y + 0.5, PRINT_W - 1, PRINT_H - 1);
      ctx.restore();

      drawScreen(ctx, sheetX, PRINT_Y - 4, SHEET_W, PRINT_H + 8, 8);
      drawHand(ctx, sheetX + SHEET_W * 0.74, PRINT_Y - 2);
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
      aria-label="手捏网点网屏从左向右滑过印样，过密处的条纹塌成均匀灰"
    />
  );
};

export default Analogy1;
