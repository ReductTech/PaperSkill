import React, { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawMeter,
  drawPatchCable,
  roundedRect,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 244;
const H = 130;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const MUTED = '#68778f';
const EMPHASIS = '#d97706';
const AUXILIARY = '#7c3aed';

export const Ch6Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const originRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
      canvas.style.width = 'min(100%, 244px)';
      canvas.style.height = 'auto';
    } catch {
      return;
    }

    const candidateColors = [CURRENT, AUXILIARY, EMPHASIS] as const;
    const candidateYs = [37, 62, 87] as const;

    const drawCandidateTrack = (index: number, progress: number) => {
      const x = 18;
      const y = candidateYs[index];
      const color = candidateColors[index];

      ctx.save();
      roundedRect(ctx, x, y, 56, 18, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = `${color}24`;
      roundedRect(ctx, x + 3, y + 3, 48 * progress, 12, 3);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`r${index + 1}`, x + 7, y + 9);

      const waveformStart = x + 24;
      for (let bar = 0; bar < 5; bar += 1) {
        const visible = clamp(progress * 6 - bar, 0, 1);
        const barHeight = (bar % 2 === 0 ? 8 : 5) * visible;
        ctx.fillRect(waveformStart + bar * 5, y + 9 - barHeight / 2, 3, barHeight);
      }
      ctx.restore();
    };

    const render = (now: number) => {
      const cycle = reduced ? 1 : ((now - originRef.current) % 3400) / 3400;
      const phase = cycle < 0.8 ? easeInOutQuad(cycle / 0.8) : 1;
      const candidateProgress = candidateYs.map((_, index) =>
        easeInOutQuad(clamp((phase - index * 0.08) / 0.38, 0, 1))
      );
      const aggregateProgress = easeInOutQuad(clamp((phase - 0.54) / 0.22, 0, 1));
      const outputProgress = easeInOutQuad(clamp((phase - 0.76) / 0.2, 0, 1));
      const settled = outputProgress > 0.94;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 10, 228, 108);

      candidateYs.forEach((y, index) => {
        drawPatchCable(
          ctx,
          { x: 74, y: y + 9 },
          { x: 102, y: 48 + index * 22 },
          candidateProgress[index] >= 1 ? candidateColors[index] : '#d7deea'
        );
      });

      ctx.save();
      ctx.strokeStyle = aggregateProgress > 0 ? AUXILIARY : '#d7deea';
      ctx.fillStyle = aggregateProgress > 0 ? AUXILIARY : '#d7deea';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(158, 70);
      ctx.lineTo(180, 70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(176, 65);
      ctx.lineTo(182, 70);
      ctx.lineTo(176, 75);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      candidateProgress.forEach((progress, index) => drawCandidateTrack(index, progress));

      drawConsole(ctx, 102, 34, 56, 72);
      ctx.save();
      ctx.fillStyle = aggregateProgress >= 1 ? AUXILIARY : CURRENT;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('聚合', 130, 54);
      [0, 1, 2].forEach((index) => {
        ctx.fillStyle = candidateProgress[index] >= 1 ? candidateColors[index] : '#d7deea';
        ctx.beginPath();
        ctx.arc(116 + index * 14, 69, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      roundedRect(ctx, 112, 82, 36, 11, 4);
      ctx.fillStyle = aggregateProgress > 0 ? `${AUXILIARY}28` : '#eef2f7';
      ctx.fill();
      ctx.strokeStyle = aggregateProgress >= 1 ? AUXILIARY : '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      drawConsole(ctx, 180, 38, 46, 64);
      if (settled) drawTargetBand(ctx, 186, 91, 34, 9);
      drawMeter(ctx, 191, 48, 0.12 + outputProgress * 0.82, settled ? SUCCESS : CURRENT, 39);

      drawStudioLabel(ctx, '独立候选', 16, 22, 'left');
      drawStudioLabel(ctx, '唯一母带', 228, 22, 'right');
      ctx.save();
      ctx.fillStyle = settled ? SUCCESS : MUTED;
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settled ? '1× 输出' : '收束中', 203, 113);
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (reduced) {
        render(performance.now());
        return;
      }
      if (rafRef.current === null) {
        originRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label="多条候选轨独立生成，经聚合控制台收束为唯一母带输出"
    />
  );
};

export default Ch6Analogy;
