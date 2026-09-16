import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawWaves, drawCanoe, runLoop } from './river-kit';

// §2 analogy (560x140): paddler rests the paddle and reads the water —
// ripple arcs splash past (high frequency) while foam dots drift steadily (trend).

const W = 560;
const H = 140;

export const AnaCh2: React.FC<WidgetProps> = () => {
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
      drawRiver(ctx, W, H, 0.45, 0.2);
      // trend: foam dots drifting steadily
      ctx.fillStyle = C.blue;
      for (let i = 0; i < 6; i++) {
        const fx = ((time * 46 + i * (W / 6)) % (W + 40)) - 20;
        const fy = 96 + 6 * Math.sin(fx / 60);
        ctx.beginPath();
        ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // hull reading the water
      drawWaves(ctx, 250, 92, time, C.waterDeep);
      drawCanoe(ctx, 250, 92, 0.0, C.blue, 0.85);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh2;
