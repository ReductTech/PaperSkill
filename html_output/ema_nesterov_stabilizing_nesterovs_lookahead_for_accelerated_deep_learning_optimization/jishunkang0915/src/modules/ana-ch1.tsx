import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCurrent, drawWaves, drawCanoe, drawLookaheadArrow, runLoop } from './river-kit';

// §1 analogy (560x140, auto loop): canoe jerks toward the latest wave, its
// lookahead arrow tip touches the red high bank while foam drifts along the channel.

const W = 560;
const H = 140;

export const AnaCh1: React.FC<WidgetProps> = () => {
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
      const bend = 0.5;
      drawRiver(ctx, W, H, 0.42, bend);
      drawCurrent(ctx, W, H, time, 0.42, bend);
      const px = 150;
      const py = 92 + 10 * Math.sin(time * 4.2);
      const len = 70 + 40 * (0.5 + 0.5 * Math.sin(time * 4.2));
      drawLookaheadArrow(ctx, px, py, len, -0.5 * len, C.red, 3.5);
      drawWaves(ctx, px, py, time, C.red);
      drawCanoe(ctx, px, py, -0.1, C.blue, 0.8);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh1;
