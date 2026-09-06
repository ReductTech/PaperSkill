import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 244;
const H = 130;

export const RulerAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const cyc = t % 4.0;
      const p = Math.min(1, cyc / 3.0);
      // three wooden bars with same baseline
      const bars = [
        { x: 50, h: 32, color: C.red },
        { x: 105, h: 52, color: C.blue },
        { x: 160, h: 78, color: C.green },
      ];
      bars.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, 96 - b.h, 26, b.h);
        ctx.strokeStyle = C.route;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, 96 - b.h, 26, b.h);
      });
      // baseline
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, 96);
      ctx.lineTo(212, 96);
      ctx.stroke();
      // measuring tape extends as one continuous action
      const tapeEnd = 36 + p * 190;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(36, 30);
      ctx.lineTo(tapeEnd, 30);
      ctx.stroke();
      // tick marks
      ctx.fillStyle = C.orange;
      for (let x = 36; x <= tapeEnd; x += 16) {
        ctx.fillRect(x, 26, 2, 8);
      }
      // measurement lines to each bar top as tape passes
      bars.forEach((b, i) => {
        const bx = b.x + 13;
        if (tapeEnd > bx + 10) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(bx, 32);
          ctx.lineTo(bx, 96 - b.h);
          ctx.stroke();
          ctx.setLineDash([]);
          label(ctx, String(b.h), bx, 104 + (i % 2 === 0 ? 8 : 16), 9, b.color);
        }
      });
      label(ctx, '同一把尺子，读同一刻度', W / 2, 14, 10, C.ink);
    };
    const t0 = performance.now();
    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} aria-label="卷尺评测类比动画" />;
};

export default RulerAna;
