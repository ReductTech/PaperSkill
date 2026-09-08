import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearStudio, drawConsole, drawLegend, drawStudioLabel, drawTargetBand } from './studio-kit';

const W = 244;
const H = 130;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';

export const Ch9Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 244px)';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    let origin = performance.now();

    const render = (phase: number) => {
      const centerX = 122;
      const centerY = 80;
      const radius = 46;
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 8, 228, 114);
      drawTargetBand(ctx, 142, 42, 64, 26);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i <= 6; i += 1) {
        const angle = Math.PI + (Math.PI * i) / 6;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 39, centerY + Math.sin(angle) * 39);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      }
      const p = Math.min(1, phase / 0.78);
      const angle = Math.PI * (1.14 + p * 0.72);
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * 37, centerY + Math.sin(angle) * 37);
      ctx.stroke();
      ctx.fillStyle = phase > 0.78 ? GREEN : ORANGE;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText('协议不可混赛', 79, 101);
      drawStudioLabel(ctx, '本卡质量 ↑', 18, 20, 'left');
      drawStudioLabel(ctx, '本卡成本 ↓', 151, 20, 'left');
      drawLegend(ctx, [{ label: '当前表针', color: ORANGE }, { label: '卡内目标', color: GREEN }], 12, 116);
    };

    const tick = (now: number) => {
      render(reduced ? 0.9 : ((now - origin) % 3300) / 3300);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      origin = performance.now();
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    if (reduced) {
      render(0.9);
      canvas.classList.add('is-ready');
    }
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="一根表针只在当前实验协议的质量和成本刻度内移动" />;
};
