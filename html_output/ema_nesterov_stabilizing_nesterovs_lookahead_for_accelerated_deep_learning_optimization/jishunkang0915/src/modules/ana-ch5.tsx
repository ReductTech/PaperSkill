import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, runLoop } from './river-kit';

// §5 analogy (560x140): at the U-valley bend, a dashed purple heading fixed far
// upstream runs into the far bank while the green canoe follows the bent channel.

const W = 560;
const H = 140;

export const AnaCh5: React.FC<WidgetProps> = () => {
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
      const bend = 0.75;
      drawRiver(ctx, W, H, 0.42, bend);
      const px = 210;
      const py = 100;
      // stale straight heading (unweighted K-step average)
      ctx.strokeStyle = C.purple;
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 200, py - 18);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLookaheadArrow(ctx, px, py, 90, -8, C.green, 3);
      drawCanoe(ctx, px, py, -0.05, C.green, 0.85);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh5;
