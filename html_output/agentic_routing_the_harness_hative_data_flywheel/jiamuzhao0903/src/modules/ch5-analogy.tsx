import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawEngineerHand,
  drawLegend,
  drawMeter,
  drawPatchCable,
  drawScoreTrack,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 244;
const H = 130;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const AUXILIARY = '#7c3aed';

export const Ch5Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    } catch {
      return;
    }

    const render = (now: number) => {
      const cycle = reduced ? 0.82 : ((now - originRef.current) % 3000) / 3000;
      const phase = easeInOutQuad(Math.min(1, cycle / 0.72));
      const handY = 45 + phase * 34;
      const complementary = phase > 0.58;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 10, 228, 108);
      drawScoreTrack(ctx, 18, 34, 108, complementary ? 1 : 0, CURRENT);
      drawScoreTrack(ctx, 18, 68, 108, complementary ? 2 : 0, complementary ? AUXILIARY : FAILURE);
      drawPatchCable(
        ctx,
        { x: 118, y: complementary ? 92 : 58 },
        { x: 190, y: 70 },
        complementary ? AUXILIARY : FAILURE
      );

      const drawShortFader = (y: number, value: number, color: string) => {
        const startX = 30;
        const width = 88;
        const knobX = startX + width * value;
        ctx.save();
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + width, y);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(knobX - 6, y - 7, 12, 14);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(knobX - 6, y - 7, 12, 14);
        ctx.restore();
      };

      drawShortFader(58, complementary ? 0.25 : 0.82, CURRENT);
      drawShortFader(92, complementary ? 0.82 : 0.78, complementary ? AUXILIARY : FAILURE);
      drawEngineerHand(ctx, 144, handY, 'press', EMPHASIS);
      if (complementary) drawTargetBand(ctx, 172, 96, 56, 17);
      drawMeter(ctx, 198, 38, complementary ? 0.86 : 0.47, complementary ? SUCCESS : EMPHASIS, 55);
      drawStudioLabel(ctx, '重复盲点', 16, 22, 'left');
      drawStudioLabel(ctx, '互补通过', 226, 22, 'right');
      drawLegend(
        ctx,
        [
          { label: '主轨', color: CURRENT },
          { label: '核查', color: AUXILIARY },
        ],
        18,
        109
      );
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
      aria-label="一只录音师的手从冗余音轨移向主提议轨与互补核查轨，主输出随后通过"
    />
  );
};

export default Ch5Analogy;
