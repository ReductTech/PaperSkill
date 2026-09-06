import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawLegend,
  drawMeter,
  drawScoreTrack,
  drawStudioLabel,
} from './studio-kit';

const W = 244;
const H = 130;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';

export const Ch7Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      clearStudio(ctx, W, H);
      drawConsole(ctx, 7, 7, 230, 116);
      drawScoreTrack(ctx, 17, 25, 145, 1, BLUE);
      ctx.fillStyle = '#fffdf7';
      ctx.fillRect(18, 73, 145, 29);
      ctx.strokeStyle = '#92400e';
      ctx.strokeRect(18, 73, 145, 29);
      ctx.fillStyle = '#68778f';
      for (let i = 0; i < 4; i += 1) ctx.fillRect(28, 81 + i * 5, 108, 2);

      const travel = Math.min(1, phase / 0.78);
      const x = 27 + travel * 124;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 17);
      ctx.lineTo(x, 105);
      ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.fillRect(x - 6, 13, 12, 8);

      const atFailure = phase > 0.7;
      drawMeter(ctx, 181, 23, atFailure ? 0.9 : 0.45, atFailure ? RED : BLUE);
      if (phase > 0.82) {
        ctx.fillStyle = GREEN;
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText('结果已记录 ✓', 67, 116);
      }
      drawStudioLabel(ctx, '失败小节', 18, 18, 'left');
      drawStudioLabel(ctx, '会话日志', 18, 69, 'left');
      drawLegend(ctx, [{ label: '动作', color: BLUE }, { label: '环境结算', color: GREEN }], 132, 102);
    };

    const tick = (now: number) => {
      const phase = reduced ? 0.88 : ((now - origin) % 3100) / 3100;
      render(phase);
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
      render(0.88);
      canvas.classList.add('is-ready');
    }
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="播放头回放失败小节并把环境结果写入会话日志" />;
};
