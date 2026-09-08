import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawEngineerHand,
  drawMeter,
  drawScoreTrack,
  drawStudioLabel,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };

const W = 244;
const H = 130;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const EMPHASIS = '#d97706';

export const Ch2Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const phase = reduced ? 0.7 : (now % 3000) / 3000;
      const playheadX = 22 + phase * 142;
      const active = Math.min(5, Math.floor(phase * 6));

      clearStudio(ctx, W, H);
      drawScoreTrack(ctx, 12, 22, 164, Math.min(2, Math.floor(active / 2)), CURRENT);

      ctx.save();
      for (let i = 0; i < 6; i += 1) {
        const x = 20 + (i % 3) * 48;
        const y = 62 + Math.floor(i / 3) * 28;
        ctx.fillStyle = i <= active ? (i === active ? EMPHASIS : CURRENT) : '#ffffff';
        ctx.strokeStyle = i <= active ? CURRENT : '#d7deea';
        ctx.lineWidth = i === active ? 2.5 : 2;
        ctx.beginPath();
        ctx.roundRect(x, y, 34, 18, 5);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = EMPHASIS;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playheadX, 16);
      ctx.lineTo(playheadX, 104);
      ctx.stroke();
      ctx.restore();

      drawEngineerHand(ctx, playheadX, 50, '检查', EMPHASIS);
      drawMeter(ctx, 208, 40, (active + 1) / 6, active === 5 ? SUCCESS : CURRENT, 58);
      drawStudioLabel(ctx, '当前小节', 14, 120, 'left');
      drawStudioLabel(ctx, active === 5 ? '已定位' : '状态', 230, 120, 'right');
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
      aria-label="播放头沿同一首歌移动，并依次照亮当前小节的执行状态字段"
    />
  );
};

export default Ch2Analogy;
