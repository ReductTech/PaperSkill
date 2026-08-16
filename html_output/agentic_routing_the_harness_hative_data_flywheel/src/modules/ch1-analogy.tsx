import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawMeter,
  drawMic,
  drawScoreTrack,
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

export const Ch1Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const phase = reduced ? 0.49 : (now % 3200) / 3200;
      const travel = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      const section = Math.min(2, Math.floor(travel * 3));
      const micX = 30 + travel * 112;
      const level = section === 0 ? 0.24 : section === 1 ? 0.58 : 0.94;
      const stateColor = section === 0 ? CURRENT : section === 1 ? SUCCESS : FAILURE;

      clearStudio(ctx, W, H);
      drawScoreTrack(ctx, 12, 16, 138, section, stateColor);
      drawTargetBand(ctx, 174, 44, 46);

      ctx.save();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(22, 82);
      ctx.lineTo(150, 82);
      ctx.stroke();
      ctx.restore();

      drawMic(ctx, micX, 72, section === 2 ? FAILURE : EMPHASIS);
      drawMeter(ctx, 190, 40, level, stateColor, 58);
      drawStudioLabel(ctx, '当前小节', 18, 112, 'left');
      drawStudioLabel(ctx, section === 1 ? '安全' : section === 2 ? '爆红' : '过低', 222, 112, 'right');

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
      aria-label="同一支话筒在轻声、合适和强奏小节之间移动，电平随之从过低进入安全带再到爆红"
      role="img"
    />
  );
};

export default Ch1Analogy;
