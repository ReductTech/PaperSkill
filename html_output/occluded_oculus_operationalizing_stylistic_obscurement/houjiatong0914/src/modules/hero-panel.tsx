import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawPen, drawStamp } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

export const HeroPanel: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawPaperSheet(ctx, 60, 44, 420, 190);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(110, 90 + i * 42);
        ctx.bezierCurveTo(210, 70 + i * 42, 300, 110 + i * 42, 430, 88 + i * 42);
        ctx.stroke();
      }
      const prog = clamp((t % 3200) / 1600, 0, 1);
      const penX = 110 + 320 * prog;
      drawPen(ctx, penX, 80 + Math.sin(prog * 6) * 6, -0.12, isNew ? COLORS.blue : COLORS.route);
      if (prog > 0.55) {
        const p = clamp((prog - 0.55) / 0.35, 0, 1);
        const r = 34 + 8 * p;
        drawStamp(ctx, 660, 138, r, isNew ? COLORS.green : COLORS.red, isNew ? '匿名' : '已识别');
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => { render(t); raf.current = requestAnimationFrame(tick); };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [isNew]);

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroPanel;
