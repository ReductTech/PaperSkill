import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, runLoop } from './river-kit';

// §4 analogy (560x140): steady stroke rhythm — dots trail behind the canoe,
// the newest stroke brightest, older ones fading geometrically (EMA weights).

const W = 560;
const H = 140;

export const AnaCh4: React.FC<WidgetProps> = () => {
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
      // calm water band
      ctx.fillStyle = C.waterLight;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);
      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.45);
      ctx.lineTo(W, H * 0.45);
      ctx.stroke();
      const speed = 60;
      const px = 120 + ((time * speed) % (W - 240));
      drawCanoe(ctx, px, 96, 0.02, C.blue, 0.85);
      // rhythm dots with geometric brightness
      for (let i = 1; i <= 8; i++) {
        const w = Math.pow(0.75, i);
        const dx = px - i * 26;
        ctx.fillStyle = C.orange;
        ctx.globalAlpha = Math.max(0.08, w);
        ctx.beginPath();
        ctx.arc(dx, 96 + 4, 3 + 3.5 * w, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh4;
