import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, runLoop } from './river-kit';

// §9 analogy (560x140): near the landing the canoe slows, the paddler lays the
// paddle across the gunwale, and the hull glides to a stop (early-rest stage).

const W = 560;
const H = 140;

export const AnaCh9: React.FC<WidgetProps> = () => {
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
      ctx.fillRect(0, H * 0.45, W, H * 0.55);
      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.45);
      ctx.lineTo(W, H * 0.45);
      ctx.stroke();
      // landing pier (target)
      ctx.fillStyle = C.wood;
      ctx.fillRect(W - 120, H * 0.4, 14, H * 0.28);
      const cyc = (time % 3.4) / 3.4;
      const ease = 1 - Math.pow(1 - cyc, 3);
      const px = 90 + ease * (W - 290);
      // paddle laid across the gunwale as the canoe settles
      ctx.save();
      ctx.translate(px, H * 0.62);
      ctx.rotate(ease > 0.8 ? 1.35 : 0.5);
      ctx.strokeStyle = C.wood;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.lineTo(12, 10);
      ctx.stroke();
      ctx.restore();
      drawCanoe(ctx, px, H * 0.62, ease > 0.95 ? 0 : 0.03, C.blue, 0.85);
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh9;
