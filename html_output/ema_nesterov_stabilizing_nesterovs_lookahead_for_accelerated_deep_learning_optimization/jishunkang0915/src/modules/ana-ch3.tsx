import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, runLoop } from './river-kit';

// §3 analogy (560x140): split view — the wave-chasing canoe wobbles toward the
// bank while the trend-following canoe glides along the channel, same time basis.

const W = 560;
const H = 140;

export const AnaCh3: React.FC<WidgetProps> = () => {
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
      drawRiver(ctx, W, H, 0.42, 0.45);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      const prog = (time % 3) / 3;
      // left: wave-chasing
      {
        const px = 30 + prog * (W / 2 - 80);
        const py = 96 + Math.sin(time * 6) * 16;
        drawLookaheadArrow(ctx, px, py, 26, -14, C.red, 2.5);
        drawCanoe(ctx, px, py, -0.14 * Math.sin(time * 6), C.red, 0.7);
      }
      // right: trend-following
      {
        const px = W / 2 + 30 + prog * (W / 2 - 80);
        const py = 98;
        drawLookaheadArrow(ctx, px, py, 26, 2, C.green, 2.5);
        drawCanoe(ctx, px, py, 0.01, C.green, 0.7);
      }
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh3;
