import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, slip, label, lamp, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Analogy 8: an order slip slides into the answer board; its four windows
// compete then one lights (purple) while the image board keeps a single green
// preset always on. A divider marks the disjoint ownership.
const W = 560;
const H = 140;

export const Ana8: React.FC<WidgetProps> = () => {
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
      clearStudio(ctx, W, H, 0.92);
      const cycle = (now / 3000) % 1;
      // answer board: four windows with SOFT routing weights that redistribute
      board(ctx, 30, 28, 220, 84, '');
      const t = (now / 1800) % (Math.PI * 2);
      const ws = [0, 1, 2, 3].map((i) => 0.5 + 0.5 * Math.sin(t + i * 1.6));
      const wsum = ws.reduce((a, b) => a + b, 0);
      for (let i = 0; i < 4; i++) {
        const wx = 44 + (i % 2) * 100;
        const wy = 44 + Math.floor(i / 2) * 36;
        const p = ws[i] / wsum;
        ctx.fillStyle = mix(SC.purple, SC.bg, 0.78 - p * 0.6);
        ctx.fillRect(wx, wy, 86, 28);
        ctx.strokeStyle = p > 0.3 ? SC.purple : SC.shade;
        ctx.lineWidth = p > 0.3 ? 2 : 1;
        ctx.strokeRect(wx, wy, 86, 28);
      }
      // incoming slip
      const sx = 30 + Math.min(1, cycle * 3) * 60;
      slip(ctx, sx - 70, 112, 56, 20, SC.blue);
      lamp(ctx, 250, 34, 6, true, SC.purple);
      // divider
      ctx.strokeStyle = SC.muted;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(282, 24);
      ctx.lineTo(282, 122);
      ctx.stroke();
      ctx.setLineDash([]);
      // image board with one always-on preset
      board(ctx, 316, 28, 150, 84, '');
      ctx.fillStyle = SC.green;
      ctx.fillRect(334, 48, 114, 44);
      ctx.strokeStyle = SC.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(334, 48, 114, 44);
      lamp(ctx, 466, 34, 6, true, SC.green);
      label(ctx, 'T-MoE', 140, 126, SC.blue, 11, 'center');
      label(ctx, 'V-Adapter', 391, 126, SC.green, 11, 'center');
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
export default Ana8;
