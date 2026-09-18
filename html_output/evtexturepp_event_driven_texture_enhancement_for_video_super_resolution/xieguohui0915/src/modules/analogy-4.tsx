import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §4 类比：一只手握红笔在印样上从左到右依次圈出几处与原件不同的位置，
// 圈过的位置留下红圈；一圈完毕自动擦除重来。

const W = 560;
const H = 140;
const LOOP_MS = 3400;

const MAIN_X = 40;
const MAIN_Y = 38;
const MAIN_W = 330;
const MAIN_H = 66;
const ORIG_X = 392;
const ORIG_Y = 38;
const ORIG_W = 128;
const ORIG_H = 66;

const REL_X = [0.2, 0.5, 0.8];
const REL_Y = [0.42, 0.62, 0.36];
const RING_T = [0.18, 0.44, 0.7];
const RING_DUR = 0.1;
const ERASE_T = 0.88;

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

/** 红笔：笔尖落在 (x, y)，笔杆向右上斜出。 */
function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(-0.35);
  ctx.fillStyle = PAPER.red;
  ctx.fillRect(-4.5, -44, 9, 34);
  ctx.strokeStyle = PAPER.ink;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-4.5, -44, 9, 34);
  ctx.beginPath();
  ctx.moveTo(-4.5, -10);
  ctx.lineTo(4.5, -10);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = '#e2c39c';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function piecewiseX(p: number, stops: { t: number; x: number }[]): number {
  if (p <= stops[0].t) return stops[0].x;
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i].t) {
      const a = stops[i - 1];
      const b = stops[i];
      return lerp(a.x, b.x, easeInOutQuad((p - a.t) / (b.t - a.t)));
    }
  }
  return stops[stops.length - 1].x;
}

const PENCIL_STOPS = [
  { t: 0.02, x: 64 },
  { t: 0.18, x: MAIN_X + REL_X[0] * MAIN_W },
  { t: 0.44, x: MAIN_X + REL_X[1] * MAIN_W },
  { t: 0.7, x: MAIN_X + REL_X[2] * MAIN_W },
  { t: 0.84, x: 352 },
];

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, displaced: boolean): void {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = displaced ? PAPER.ink : PAPER.muted;
  ctx.strokeRect(x - 7, y - 7 + (displaced ? 5 : 0), 14, 14);
  ctx.restore();
}

export const Analogy4: React.FC<WidgetProps> = () => {
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

      drawPrint(ctx, MAIN_X, MAIN_Y, MAIN_W, MAIN_H);
      drawPrint(ctx, ORIG_X, ORIG_Y, ORIG_W, ORIG_H);

      for (let i = 0; i < REL_X.length; i++) {
        drawMark(ctx, MAIN_X + REL_X[i] * MAIN_W, MAIN_Y + REL_Y[i] * MAIN_H, true);
        drawMark(ctx, ORIG_X + REL_X[i] * ORIG_W, ORIG_Y + REL_Y[i] * ORIG_H, false);
      }

      const erase = clamp((p - ERASE_T) / (1 - ERASE_T), 0, 1);

      // 依次圈出三处差值
      for (let i = 0; i < RING_T.length; i++) {
        const prog = clamp((p - RING_T[i]) / RING_DUR, 0, 1);
        if (prog <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 1 - erase;
        ctx.strokeStyle = PAPER.red;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(
          MAIN_X + REL_X[i] * MAIN_W,
          MAIN_Y + REL_Y[i] * MAIN_H,
          23,
          19,
          0,
          -Math.PI / 2,
          -Math.PI / 2 + prog * Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      const tipX = piecewiseX(p, PENCIL_STOPS);
      const tipY = 72;
      drawPencil(ctx, tipX, tipY, 1 - erase);
      drawHand(ctx, tipX + 14, tipY - 41);
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
      aria-label="手拿红笔在印样上依次圈出与原件不同的位置，圈完擦除重来"
    />
  );
};

export default Analogy4;
