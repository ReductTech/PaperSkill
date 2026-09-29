import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawWheel,
  drawClay,
  drawSceneLabel,
  drawValueChip,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch2 analogy: two masters share one stove — the eye master (blue, 3B VLM)
// inspects the order and the clay; the shape master (green, 300M expert)
// pulls the vase on the spinning wheel. A dotted token stream connects them.
const W = 560;
const H = 140;

export const Ch2Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // Shared stove between the two stations (同灶).
      ctx.save();
      ctx.fillStyle = '#ddd2bd';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(262, 78, 36, 28, 4);
      ctx.fill();
      ctx.stroke();
      const flick = 0.5 + 0.5 * Math.sin(ms / 110);
      ctx.globalAlpha = 0.45 + 0.5 * flick;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(280, 66);
      ctx.quadraticCurveTo(272, 76, 280, 86);
      ctx.quadraticCurveTo(288, 76, 280, 66);
      ctx.fill();
      ctx.restore();

      // Left: the eye master studies the order card and the raw clay.
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.roundRect(30, 20, 58, 36, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(38, 30);
      ctx.lineTo(80, 30);
      ctx.moveTo(38, 38);
      ctx.lineTo(72, 38);
      ctx.stroke();
      ctx.strokeRect(38, 44, 12, 8);
      ctx.restore();
      drawClay(ctx, 176, 94, 0.1, { color: C.muted, size: 0.6, t: ms / 420 });
      drawPotter(ctx, 120, 106, 1.15, { mode: 'eye', t: ms / 600, color: C.blue });

      // Dotted token stream: magnifier -> wheel clay.
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.35 * Math.sin(ms / 300);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.75;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(154, 74);
      ctx.lineTo(372, 62);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(380, 62);
      ctx.lineTo(370, 57);
      ctx.lineTo(370, 67);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Right: the shape master pulls the vase on the wheel.
      drawWheel(ctx, 424, 78, 28, { spin: ms / 500 });
      drawClay(ctx, 424, 64, 0.55 + 0.08 * Math.sin(ms / 400), { size: 0.9, t: ms / 500 });
      drawPotter(ctx, 470, 106, 1.15, { mode: 'shape', t: ms / 280, color: C.green });

      drawValueChip(ctx, 96, 24, '3B', C.blue);
      drawValueChip(ctx, 506, 24, '300M', C.green);
      drawSceneLabel(ctx, '掌眼师傅', 16, 22, { color: C.blue });
      drawSceneLabel(ctx, '巧手师傅', 410, 22, { color: C.green });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch2Analogy;
