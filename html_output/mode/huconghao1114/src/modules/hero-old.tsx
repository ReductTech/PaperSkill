import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, dial, wallPrint, lamp, label, hand } from './studio-kit';
import type { WidgetProps } from './registry';

// Hero old-method side: one shared preset dial turned toward the answer mark;
// the landscape print on the wall degrades toward red as the pointer approaches.
const W = 480;
const H = 260;
const BLUE_ANGLE = -0.5; // answer mark
const GREEN_ANGLE = 2.6; // generation mark

export const HeroOld: React.FC<WidgetProps> = () => {
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
      clearStudio(ctx, W, H, 0.86);
      // pointer oscillates between the green (generation) and blue (answer) marks
      const cycle = (now / 3200) % 1;
      const t = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2; // 0..1..0
      const angle = GREEN_ANGLE + (BLUE_ANGLE - GREEN_ANGLE) * t;
      // the further toward the answer mark, the more the wall print degrades
      const shift = Math.max(0, t - 0.15) / 0.85;
      wallPrint(ctx, 300, 58, 120, 132, shift * 0.9);
      // answer order lamp
      lamp(ctx, 442, 44, 9, t > 0.6, SC.blue);
      // shared preset dial
      dial(ctx, 150, 158, 54, angle, shift > 0.6 ? SC.red : undefined);
      // marks on the dial
      const mb = { x: 150 + Math.cos(BLUE_ANGLE) * 68, y: 158 + Math.sin(BLUE_ANGLE) * 68 };
      const mg = { x: 150 + Math.cos(GREEN_ANGLE) * 68, y: 158 + Math.sin(GREEN_ANGLE) * 68 };
      ctx.fillStyle = SC.blue;
      ctx.beginPath();
      ctx.arc(mb.x, mb.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = SC.green;
      ctx.beginPath();
      ctx.arc(mg.x, mg.y, 4, 0, Math.PI * 2);
      ctx.fill();
      hand(ctx, 150 + Math.cos(angle) * (54 + 14), 158 + Math.sin(angle) * (54 + 14), angle, 26);
      label(ctx, '答题', mb.x + 8, mb.y - 8, SC.blue, 12);
      label(ctx, '出图', mg.x - 8, mg.y + 18, SC.green, 12);
      label(ctx, '0.3422 → 0.1458', 362, 206, shift > 0.6 ? SC.red : SC.muted, 11, 'center');
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
export default HeroOld;
