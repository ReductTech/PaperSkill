import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, runLoop } from './river-kit';

// §8 analogy (560x140): two alternating beats — the paddle pushes the canoe
// forward (A_t update), then the wake trail updates to the new rhythm memory (EMA).

const W = 560;
const H = 140;

export const AnaCh8: React.FC<WidgetProps> = () => {
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
      const beat = Math.floor((time * 1.4) % 2); // 0: push, 1: memorize
      const px = 240;
      const py = 100;
      const pulse = (time * 1.4) % 1;
      if (beat === 0) {
        // push beat: paddle strokes, canoe inches forward
        drawCanoe(ctx, px + 6 * pulse, py, 0.04, C.blue, 0.85);
        ctx.strokeStyle = C.wood;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(px + 4, py - 20 + 24 * pulse);
        ctx.lineTo(px + 26, py + 8);
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('推桨 A_t', px + 34, py - 12);
      } else {
        // memorize beat: wake dots update
        drawCanoe(ctx, px, py, 0, C.blue, 0.85);
        for (let i = 1; i <= 4; i++) {
          ctx.fillStyle = C.orange;
          ctx.globalAlpha = Math.max(0.1, 1 - i * 0.22);
          ctx.beginPath();
          ctx.arc(px - i * 20, py + 5, 3 + 2 * (1 - i * 0.18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('记水痕 EMA', px + 34, py - 12);
      }
    });
    return stop;
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default AnaCh8;
