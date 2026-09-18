import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawWaves, drawCanoe, runLoop } from './river-kit';

// §6 analogy (560x140): near-water close view — high-frequency ripples shake and
// fade at the hull while the low-frequency foam band passes steadily underneath.

const W = 560;
const H = 140;

export const AnaCh6: React.FC<WidgetProps> = () => {
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
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.5);
      ctx.lineTo(W, H * 0.5);
      ctx.stroke();
      // low-frequency foam band passing steadily
      ctx.fillStyle = C.blue;
      for (let i = 0; i < 5; i++) {
        const fx = ((time * 34 + i * (W / 5)) % (W + 30)) - 15;
        ctx.beginPath();
        ctx.arc(fx, H * 0.72, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // high-frequency ripples fading at the hull
      drawWaves(ctx, 250, H * 0.5, time, C.orange);
      drawCanoe(ctx, 250, H * 0.5, 0.03 * Math.sin(time * 12), C.blue, 0.8);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh6;
