import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, slip, filmChip, label, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 2: one landscape print is cut into six film chips that interleave
// with order slips into a single film holder.
const W = 560;
const H = 140;
const ITEMS = 12; // 6 chips + 6 slips, alternating
const SLOT_X = 316;
const SLOT_W = 18;
const ROW2_Y = 84;

function slotPos(i: number) {
  const row = i < 7 ? 0 : 1;
  const col = row === 0 ? i : i - 7;
  return { x: SLOT_X + col * (SLOT_W + 4), y: row === 0 ? 36 : ROW2_Y };
}

export const Ana2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (now: number) => {
      clearStudio(ctx, W, H, 0.9);
      const cycle = (now / 3200) % 1;
      // source print (being cut) and slip stack at the left
      const cut = Math.min(1, cycle * 6);
      ctx.fillStyle = SC.green;
      ctx.fillRect(24, 40, 60, 44 * (1 - cut * 0.35));
      ctx.strokeStyle = SC.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 40, 60, 44 * (1 - cut * 0.35));
      slip(ctx, 26, 96, 56, 22);
      label(ctx, '裁片入夹', 54, 126, SC.muted, 11, 'center');
      // holder
      ctx.strokeStyle = mix(SC.blue, SC.bg, 0.3);
      ctx.lineWidth = 2;
      ctx.strokeRect(SLOT_X - 10, 26, 7 * (SLOT_W + 4) + 8, 92);
      // items slide to their slots one by one
      for (let i = 0; i < ITEMS; i++) {
        const ti = i / ITEMS;
        const p = Math.max(0, Math.min(1, (cycle - ti) * 2.2));
        const e = 1 - Math.pow(1 - p, 3);
        const isChip = i % 2 === 0;
        const src = { x: isChip ? 40 : 40, y: isChip ? 48 : 102 };
        const dst = slotPos(i);
        const x = src.x + (dst.x - src.x) * e;
        const y = src.y + (dst.y - src.y) * e;
        if (isChip) filmChip(ctx, x, y, SLOT_W, SC.green);
        else slip(ctx, x, y, SLOT_W, 30);
      }
      // holder glow when fully loaded
      if (cycle > 0.92 || cycle < 0.04) {
        ctx.strokeStyle = SC.blue;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(SLOT_X - 10, 26, 7 * (SLOT_W + 4) + 8, 92);
      }
      label(ctx, '图文混排', 440, 126, SC.muted, 11, 'center');
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default Ana2;
