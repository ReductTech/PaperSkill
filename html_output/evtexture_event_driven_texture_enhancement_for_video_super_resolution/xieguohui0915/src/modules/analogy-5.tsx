import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawDial, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §5 类比：一只手反复按压密度计气囊，表盘指针只在超过一格刻度时突然跳一格，
// 其余时间完全静止。

const W = 560;
const H = 140;
const LOOP_MS = 2600;

const DIAL_X = 176;
const DIAL_Y = 66;
const DIAL_R = 44;
const MARKS = 8;
const BULB_X = 72;
const BULB_Y = 98;

// 五次按压对应的真实密度：它每次只涨一点点，指针只在真的越过一格时才动。
const DENSITY = [0.16, 0.3, 0.38, 0.46, 0.54];
const SLOTS = DENSITY.length;

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

export const Analogy5: React.FC<WidgetProps> = () => {
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

      const slotF = p * SLOTS;
      const slot = Math.min(SLOTS - 1, Math.floor(slotF));
      const local = slotF - slot;
      const press = Math.sin(local * Math.PI);

      const markOf = (v: number) => Math.floor(v * (MARKS - 1));
      const target = markOf(DENSITY[slot]);
      // 只有挤压越过了那一道刻度，指针才跳；否则完全不动。
      const needle = press > 0.45 ? target : slot === 0 ? 0 : markOf(DENSITY[slot - 1]);

      // 气囊与它连到表盘的细管
      ctx.save();
      ctx.strokeStyle = PAPER.muted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BULB_X + 24, BULB_Y - 2);
      ctx.lineTo(DIAL_X - 40, DIAL_Y + 14);
      ctx.stroke();
      ctx.fillStyle = PAPER.print;
      ctx.strokeStyle = PAPER.tableShadow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(BULB_X, BULB_Y, 24 - press * 6, 15 - press * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawDial(ctx, DIAL_X, DIAL_Y, DIAL_R, MARKS, needle, PAPER.orange);
      drawHand(ctx, BULB_X, 86 - press * 7);
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
      aria-label="手反复按压密度计气囊，指针只在超过一格刻度时才跳一格"
    />
  );
};

export default Analogy5;
