import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { STUDIO, clearStudio, drawConsole, drawEngineerHand, drawMeter, drawPatchCable, drawScoreTrack, drawStudioLabel, drawTargetBand } from './studio-kit';

const W = 380;
const H = 174;

export const HeroAgenticMix: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const phase = reduced ? 0.92 : ((now - started) % 3300) / 3300;
      const section = Math.min(3, Math.floor(phase * 4));
      const hard = section === 2;
      const handX = 90 + section * 42;
      clearStudio(ctx, W, H);
      drawConsole(ctx, 12, 12, 356, 150);
      drawScoreTrack(ctx, 28, 30, 196, section, STUDIO.blue);
      drawStudioLabel(ctx, '当前状态 → 能力调度', 28, 20);
      const inputs = hard ? [{ x: 245, y: 60 }, { x: 245, y: 91 }, { x: 245, y: 122 }] : [{ x: 245, y: 91 }];
      inputs.forEach((p, i) => {
        drawPatchCable(ctx, { x: 205, y: 91 }, p, i === 1 ? STUDIO.purple : STUDIO.blue);
        ctx.fillStyle = i === 1 ? STUDIO.purple : STUDIO.blue;
        ctx.fillRect(p.x + 8, p.y - 8, 30, 16);
      });
      drawEngineerHand(ctx, handX, 91, 'patch', STUDIO.orange);
      drawTargetBand(ctx, 316, 57, 37, 68);
      drawMeter(ctx, 322, 49, hard ? 0.78 : 0.64, STUDIO.green, 84);
      ctx.fillStyle = STUDIO.green;
      ctx.font = '700 13px "Segoe UI"';
      ctx.fillText(hard ? '互补后通过' : '单路够用', 271, 146);
      canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(draw);
    };
    const stop = () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (raf.current === null) raf.current = requestAnimationFrame(draw); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} aria-label="依据执行状态选择单一或互补模型并记录结果" />;
};

export default HeroAgenticMix;
