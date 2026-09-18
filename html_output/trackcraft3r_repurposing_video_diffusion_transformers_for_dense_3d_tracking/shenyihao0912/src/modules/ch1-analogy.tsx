import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Ch1 analogy card: the camcorder pans left-right; inside the drifting viewfinder
// the seated dog slides across the frame, while its faint true position in the
// room never moves. The green nose mark is present the whole time.
const W = 560;
const H = 140;
const LOOP = 3000;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const dogX = W * 0.44;
    const groundY = H - 28;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // true room position: static, faint — the dog never actually moves
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawDog(ctx, dogX, groundY, 1, { mood: 'idle', t });
      ctx.restore();
      drawTracker(ctx, dogX + 23, groundY - 25, 3);
      // drifting viewfinder
      const vw = 180;
      const vh = 92;
      const pan = Math.sin(t * Math.PI * 2) * 78;
      const vx = W / 2 - vw / 2 + pan;
      const vy = 18;
      ctx.save();
      ctx.beginPath();
      ctx.rect(vx, vy, vw, vh);
      ctx.clip();
      ctx.fillStyle = C.white;
      ctx.fillRect(vx, vy, vw, vh);
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx, vy + vh - 22);
      ctx.lineTo(vx + vw, vy + vh - 22);
      ctx.stroke();
      // inside the frame the dog slides opposite to the pan
      const inDogX = dogX - pan * 1.7;
      const inGround = vy + vh - 8;
      drawDog(ctx, inDogX, inGround, 0.95, { mood: 'idle', t });
      drawTracker(ctx, inDogX + 22, inGround - 24, 3);
      ctx.restore();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(vx, vy, vw, vh);
      // corner ticks for a viewfinder feel
      ctx.lineWidth = 2;
      const tk = 10;
      [
        [vx, vy, 1, 1],
        [vx + vw, vy, -1, 1],
        [vx, vy + vh, 1, -1],
        [vx + vw, vy + vh, -1, -1],
      ].forEach(([cx, cy, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + sx * tk, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * tk);
        ctx.stroke();
      });
      const lx = Math.min(Math.max(vx + vw / 2, 44), W - 44);
      drawSceneLabel(ctx, '取景框', lx, vy - 9, { color: C.blue, align: 'center' });
      drawSceneLabel(ctx, '房间', 12, H - 10, { color: C.muted });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Analogy;
