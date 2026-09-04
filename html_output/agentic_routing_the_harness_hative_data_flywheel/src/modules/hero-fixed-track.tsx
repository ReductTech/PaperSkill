import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { STUDIO, clearStudio, drawConsole, drawMeter, drawMic, drawScoreTrack, drawStudioLabel, drawTargetBand } from './studio-kit';

const W = 380;
const H = 174;

export const HeroFixedTrack: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 380px)';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const started = performance.now();
    const draw = (now: number) => {
      const phase = reduced ? 0.78 : ((now - started) % 3300) / 3300;
      const section = Math.min(3, Math.floor(phase * 4));
      const levels = [0.26, 0.48, 0.94, 0.36];
      const level = levels[section];
      const color = level > 0.82 ? STUDIO.red : level < 0.34 ? STUDIO.orange : STUDIO.blue;
      clearStudio(ctx, W, H);
      drawConsole(ctx, 12, 12, 356, 150);
      drawScoreTrack(ctx, 30, 34, 205, section, color);
      drawStudioLabel(ctx, '同一模型 · 固定档位', 30, 23);
      drawMic(ctx, 70 + section * 47, 91, STUDIO.blue);
      drawTargetBand(ctx, 279, 59, 46, 48);
      drawMeter(ctx, 290, 47, level, color, 79);
      ctx.fillStyle = STUDIO.red;
      ctx.font = '700 13px "Segoe UI"';
      ctx.fillText(level > 0.82 ? '爆红返工' : level < 0.34 ? '能力浪费' : '暂时可用', 264, 145);
      canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (raf.current === null) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} aria-label="固定模型在不同步骤间出现浪费与失真" />;
};

export default HeroFixedTrack;
