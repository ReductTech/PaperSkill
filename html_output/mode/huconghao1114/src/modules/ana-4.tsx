import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, arrowLine, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 4: on the parameter ring the fixed green generation direction and the
// oscillating blue answer direction cross 90 degrees; the needle swings red.
const W = 560;
const H = 140;
const CX = 110;
const CY = 74;
const R = 46;

export const Ana4: React.FC<WidgetProps> = () => {
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
    let raf = 0;

    const render = (now: number) => {
      clearStudio(ctx, W, H, 0.9);
      const cycle = (now / 3000) % 1;
      const t = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2; // 0..1 -> 0..180 deg
      const theta = (t * 180 * Math.PI) / 180;
      const conflict = Math.cos(theta) < 0;
      // ring
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = SC.handle;
      ctx.lineWidth = 3;
      ctx.stroke();
      // arc between the two directions
      ctx.beginPath();
      ctx.arc(CX, CY, R - 12, 0, -theta, true);
      ctx.strokeStyle = conflict ? SC.red : SC.green;
      ctx.lineWidth = 2;
      ctx.stroke();
      // fixed green direction (g_v)
      arrowLine(ctx, CX, CY, CX + Math.cos(0) * (R + 16), CY + Math.sin(0) * (R + 16), SC.green, 3);
      // moving blue direction (g_t)
      arrowLine(ctx, CX, CY, CX + Math.cos(theta) * (R + 16), CY + Math.sin(theta) * (R + 16), SC.blue, 3);
      // needle: deflects right (red) when conflicting
      const deflect = conflict ? 0.7 : -0.5;
      ctx.strokeStyle = conflict ? SC.red : SC.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX - 8 + deflect * 12, CY - R - 14);
      ctx.stroke();
      // loss gauge
      ctx.fillStyle = SC.ground;
      ctx.fillRect(360, 52, 170, 16);
      ctx.fillStyle = mix(SC.ground, SC.red, 0.55);
      ctx.fillRect(360 + 85, 52, 85, 16);
      ctx.fillStyle = mix(SC.ground, SC.green, 0.55);
      ctx.fillRect(360, 52, 85, 16);
      const gx = 360 + 85 + Math.min(1, Math.abs(Math.cos(theta))) * 80 * (conflict ? 1 : -1);
      ctx.fillStyle = conflict ? SC.red : SC.green;
      ctx.fillRect(gx - 3, 46, 6, 28);
      label(ctx, 'ΔL_v', 360, 42, SC.muted, 11);
      label(ctx, conflict ? '冲突' : '一致', 530, 42, conflict ? SC.red : SC.green, 11, 'right');
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default Ana4;
