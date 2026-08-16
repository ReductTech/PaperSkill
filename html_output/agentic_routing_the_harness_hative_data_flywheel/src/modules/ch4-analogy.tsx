import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawFader,
  drawLegend,
  drawMeter,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 244;
const H = 130;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';

export const Ch4Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const cycle = reduced ? 0.5 : ((now - originRef.current) % 3200) / 3200;
      const shuttle = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
      const position = easeInOutQuad(shuttle);
      const stateColor = position < 0.27 ? FAILURE : position < 0.68 ? SUCCESS : EMPHASIS;
      const quality = Math.max(0.18, 1 - Math.abs(position - 0.48) * 1.55);

      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 10, 228, 108);
      drawTargetBand(ctx, 76, 78, 66);

      drawFader(ctx, 28, 70, position, EMPHASIS);
      drawMeter(ctx, 176, 31, quality, stateColor);
      drawMeter(ctx, 207, 31, position, position > 0.68 ? EMPHASIS : CURRENT);
      drawStudioLabel(ctx, '失真', 24, 28, 'left');
      drawStudioLabel(ctx, '可用带', 109, 28, 'center');
      drawLegend(
        ctx,
        [
          { label: '质量', color: SUCCESS },
          { label: '成本', color: EMPHASIS },
        ],
        156,
        112
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
      aria-label="一个混音推子在失真、可用质量成本带与超预算位置之间移动"
    />
  );
};

export default Ch4Analogy;
