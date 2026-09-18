import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, drawTarget, runLoop } from './river-kit';

// §10 analogy (560x140): two canoes race from the same baseline to the
// confluence flag; the green hull docks first (verified perplexity, Fig 4).

const W = 560;
const H = 140;

export const AnaCh10: React.FC<WidgetProps> = () => {
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
      drawTarget(ctx, W - 54, H * 0.66);
      const cyc = (time % 3.4) / 3.4;
      const eased = cyc < 0.5 ? 2 * cyc * cyc : 1 - Math.pow(-2 * cyc + 2, 2) / 2;
      drawCanoe(ctx, 50 + eased * (W - 170), H * 0.68, 0.02, C.green, 0.8);
      drawCanoe(ctx, 50 + eased * (W - 170) * 0.6, H * 0.9, 0, '#68778f', 0.8);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh10;
