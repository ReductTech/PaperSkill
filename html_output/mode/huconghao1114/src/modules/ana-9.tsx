import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, album, lamp, label, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 9: a flashlight sweeps the darkroom across the answer board, the image
// board, and the reference album; each lights up green as the beam passes.
const W = 560;
const H = 140;

export const Ana9: React.FC<WidgetProps> = () => {
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
      // darkroom background
      ctx.fillStyle = '#3d4442';
      ctx.fillRect(0, 0, W, H);
      const cycle = (now / 3200) % 1;
      const beam = 60 + cycle * 460;
      const lit = (x: number) => Math.abs(beam - x) < 70;
      // beam glow
      const grad = ctx.createRadialGradient(beam, 70, 8, beam, 70, 110);
      grad.addColorStop(0, 'rgba(255,244,214,0.35)');
      grad.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // answer board
      board(ctx, 30, 36, 130, 70, '');
      ctx.fillStyle = lit(95) ? mix(SC.blue, SC.paper, 0.4) : mix(SC.blue, '#3d4442', 0.75);
      ctx.fillRect(46, 54, 98, 34);
      lamp(ctx, 95, 118, 7, lit(95), SC.green);
      // image board
      board(ctx, 210, 36, 130, 70, '');
      ctx.fillStyle = lit(275) ? mix(SC.green, SC.paper, 0.4) : mix(SC.green, '#3d4442', 0.75);
      ctx.fillRect(226, 54, 98, 34);
      lamp(ctx, 275, 118, 7, lit(275), SC.green);
      // reference album
      album(ctx, 390, 36, 140, 70, lit(460) ? 0.6 : 0.3);
      lamp(ctx, 460, 118, 7, lit(460), SC.green);
      // all-lit seal
      if (lit(95) && lit(275) && lit(460)) {
        label(ctx, '验收通过', 280, 24, SC.green, 12, 'center');
      }
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
export default Ana9;
