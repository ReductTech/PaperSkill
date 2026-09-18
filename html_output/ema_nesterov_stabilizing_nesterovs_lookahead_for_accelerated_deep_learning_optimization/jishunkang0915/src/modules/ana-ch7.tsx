import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, drawTarget, runLoop } from './river-kit';

// §7 analogy (560x140): one canoe rides the current toward the flag; another
// paddles without current help — visibly slower (acceleration, not data).

const W = 560;
const H = 140;

export const AnaCh7: React.FC<WidgetProps> = () => {
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
    const stop = runLoop(canvas, (time) => {
      clearScene(ctx, W, H);
      ctx.fillStyle = C.waterLight;
      ctx.fillRect(0, H * 0.42, W, H * 0.58);
      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.42);
      ctx.lineTo(W, H * 0.42);
      ctx.stroke();
      drawTarget(ctx, W - 60, H * 0.6);
      const cyc = (time % 3.2) / 3.2;
      const eased = cyc < 0.5 ? 2 * cyc * cyc : 1 - Math.pow(-2 * cyc + 2, 2) / 2;
      // with current (green): faster
      drawCanoe(ctx, 60 + eased * (W - 190), H * 0.62, 0.02, C.green, 0.8);
      // without help (gray): slower
      drawCanoe(ctx, 60 + eased * (W - 190) * 0.55, H * 0.86, 0, '#68778f', 0.8);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh7;
