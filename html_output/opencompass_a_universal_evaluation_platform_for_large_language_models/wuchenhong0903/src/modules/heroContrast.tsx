import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label, ruler, sheet, pen } from './kit';

// Hero two-panel contrast (old vs new). Reads moduleId: "old" = fragmented manual
// grading (red), "new" = OpenCompass unified rubric (green). Both auto-animate.
const W = 360;
const H = 180;

export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';
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
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const ph = (Math.sin(t * 2) + 1) / 2;
      clear(ctx, W, H);
      if (!isNew) {
        // Old: three sheets with mismatched, tilted red score rulers + a struggling pen.
        const ys = [38, 86, 134];
        for (let i = 0; i < 3; i++) {
          sheet(ctx, 40, ys[i] - 16, 130, 32, '#fff', 2);
          ruler(ctx, 48, ys[i] + i * 4 + ph * 2, 100, 8, i === 1 ? C.red : C.muted, C.red);
        }
        pen(ctx, 210 + ph * 10, 60 + ph * 20, C.red, 0.5);
        label(ctx, '标准不一的散乱手改', 250, 140, 14, C.red, 'center', 700);
      } else {
        // New: three sheets aligned under ONE green ruler + a unified scoreboard.
        const ys = [38, 86, 134];
        ruler(ctx, 48, 40, 120, 10, C.green, C.green);
        for (let i = 0; i < 3; i++) {
          sheet(ctx, 40, ys[i], 130, 30, '#fff', 2);
          ctx.fillStyle = C.green;
          ctx.beginPath();
          ctx.arc(70 + ((i + t * 0.5) % 1) * 70, ys[i] + 15, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        rr(ctx, 210, 56, 120, 68, 8);
        ctx.fill();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        rr(ctx, 210, 56, 120, 68, 8);
        ctx.stroke();
        ctx.lineWidth = 1;
        label(ctx, '统一标准 · 一次评测', 270, 90, 13, C.green, 'center', 800);
        label(ctx, '一键对齐，横向可比', 270, 108, 12, C.ink, 'center');
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isNew]);
  return <canvas ref={canvasRef} width={W} height={H} aria-label="新旧方法对比" />;
};

export default HeroContrast;
