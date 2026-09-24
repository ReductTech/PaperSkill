import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawCookbook, drawStove, drawTokenChip, drawCheckMark, drawLegend, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Ch.8 analogy (560x140, auto-loop): packing check — the chef's gear (cookbook,
// stove+pan, spoon, token chips) laid out on a mat; a magnifying glass sweeps
// across and each item glows (green ring) as it is inspected.
const W = 560;
const H = 140;
const LOOP = 5600;

// item centers on the mat + bounding boxes for the glow rings
const ITEMS: { cx: number; x: number; y: number; w: number; h: number }[] = [
  { cx: 112, x: 88, y: 74, w: 48, h: 44 }, // cookbook stack
  { cx: 224, x: 184, y: 92, w: 80, h: 32 }, // stove with pan
  { cx: 336, x: 320, y: 64, w: 34, h: 52 }, // spoon
  { cx: 448, x: 408, y: 78, w: 78, h: 36 }, // token chips
];

function spoon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 4, y - 24);
  ctx.stroke();
  ctx.fillStyle = C.white;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.ellipse(x + 8, y - 30, 6.5, 9, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const Ch8Analogy: React.FC<WidgetProps> = () => {
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

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      const mx = 64 + t * 432;
      const my = 72 + Math.sin(ms / 320) * 3;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // the packing mat is the counter
      ctx.save();
      ctx.fillStyle = '#e9efdf';
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, 52, 488, 66, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawCookbook(ctx, 112, 114, 1);
      drawStove(ctx, 224, 116, 1);
      spoon(ctx, 336, 112);
      drawTokenChip(ctx, 430, 96, '1');
      drawTokenChip(ctx, 464, 96, '128');

      ITEMS.forEach((it) => {
        const active = Math.abs(mx - it.cx) < 44;
        const passed = mx > it.cx + 46;
        if (active) {
          ctx.save();
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(it.x, it.y, it.w, it.h, 8);
          ctx.stroke();
          ctx.restore();
        }
        if (passed) drawCheckMark(ctx, it.cx, 42, 7);
      });

      // the magnifying glass sweeping across the gear
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(mx, my, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx + 11, my + 11);
      ctx.lineTo(mx + 23, my + 25);
      ctx.stroke();
      ctx.restore();

      drawSceneLabel(ctx, '出包检查', 36, 24);
      drawLegend(ctx, [['已检查', C.green], ['检查中', C.blue]], 36, 130);
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

export default Ch8Analogy;
