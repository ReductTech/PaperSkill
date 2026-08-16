import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawConsole,
  drawFader,
  drawMeter,
  drawMic,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };

const W = 244;
const H = 130;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';

export const Ch3Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = 'min(100%, 244px)';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const draw = (now: number) => {
      const phase = reduced ? 0.5 : (now % 3100) / 3100;
      const triangular = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      const capability = 0.18 + triangular * 0.72;
      const demand = 0.55;
      const resultColor = capability < demand ? FAILURE : capability <= demand + 0.16 ? SUCCESS : CURRENT;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 70, 24, 132, 80);
      drawMic(ctx, 28, 40, CURRENT);
      drawMic(ctx, 28, 68, CURRENT);
      drawMic(ctx, 28, 96, CURRENT);
      drawTargetBand(ctx, 70 + demand * 120 - 14, 50, 28, 24);
      drawFader(ctx, 70, 62, capability, EMPHASIS);
      drawMeter(ctx, 204, 36, capability, resultColor, 64);

      ctx.save();
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(184, 102 - demand * 70);
      ctx.lineTo(228, 102 - demand * 70);
      ctx.stroke();
      ctx.restore();

      drawStudioLabel(ctx, '能力', 86, 118, 'left');
      drawStudioLabel(ctx, capability < demand ? '不足' : capability <= demand + 0.16 ? '够用' : '过度', 230, 118, 'right');
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      draw(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      aria-label="输入选择旋钮在能力不足、刚好覆盖与过度配置之间移动"
    />
  );
};

export default Ch3Analogy;
