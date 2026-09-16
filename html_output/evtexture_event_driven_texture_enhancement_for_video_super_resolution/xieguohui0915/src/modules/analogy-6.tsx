import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawPrint,
  drawEventDots,
  drawLegend,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// §6 类比：一只手握描点笔沿印样上移动的边缘缓缓划过，
// 笔尖下方依次落下小点，点与点连成一条斜线。

const W = 560;
const H = 140;
const LOOP_MS = 3200;

const PRINT_X = 40;
const PRINT_Y = 38;
const PRINT_W = 480;
const PRINT_H = 66;
const EDGE_X0 = PRINT_X + 10;
const EDGE_X1 = PRINT_X + PRINT_W - 10;
const EDGE_Y0 = 60;
const EDGE_Y1 = 90;
const DOT_N = 70;

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

function edgeY(x: number): number {
  return lerp(EDGE_Y0, EDGE_Y1, (x - EDGE_X0) / (EDGE_X1 - EDGE_X0));
}

export const Analogy6: React.FC<WidgetProps> = () => {
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

      // 印样上的明暗分界：一条斜边
      ctx.save();
      ctx.beginPath();
      ctx.rect(PRINT_X, PRINT_Y, PRINT_W, PRINT_H);
      ctx.clip();
      ctx.fillStyle = 'rgba(33,50,74,0.12)';
      ctx.beginPath();
      ctx.moveTo(PRINT_X, edgeY(EDGE_X0));
      ctx.lineTo(EDGE_X1, edgeY(EDGE_X1));
      ctx.lineTo(PRINT_X + PRINT_W, PRINT_Y + PRINT_H);
      ctx.lineTo(PRINT_X, PRINT_Y + PRINT_H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PAPER.muted;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(EDGE_X0, edgeY(EDGE_X0));
      ctx.lineTo(EDGE_X1, edgeY(EDGE_X1));
      ctx.stroke();
      ctx.restore();

      const tipX = lerp(EDGE_X0, EDGE_X1, easeInOutQuad(clamp(p, 0, 1)));
      const tipY = edgeY(tipX);

      // 笔尖一路落下的点，连成一条斜线
      const dots: { x: number; y: number; p: number }[] = [];
      for (let k = 0; k < DOT_N; k++) {
        const x = lerp(EDGE_X0, EDGE_X1, k / (DOT_N - 1));
        if (x > tipX) break;
        dots.push({
          x,
          y: edgeY(x) - 1.5 + ((k % 3) - 1) * 1.6,
          p: k % 6 < 3 ? 1 : -1,
        });
      }
      drawEventDots(ctx, dots, 'polarity');

      // 描点笔与握着它的手
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(-0.5);
      ctx.strokeStyle = PAPER.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -30);
      ctx.stroke();
      ctx.fillStyle = PAPER.ink;
      ctx.beginPath();
      ctx.arc(0, 2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawHand(ctx, tipX + 14, tipY - 26);

      drawLegend(ctx, PRINT_X, 126, [
        { color: PAPER.evOn, label: '变亮' },
        { color: PAPER.evOff, label: '变暗' },
      ]);
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
      aria-label="描点笔沿移动的边缘划过，笔尖落下的小点连成一条斜线"
    />
  );
};

export default Analogy6;
