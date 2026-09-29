import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerpColor } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawClay,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch4 analogy: kneading lesson — a finished piece A (green), a noise blob ε
// (grey), and the blend in between whose mix ratio τ cycles 0 -> 1 -> 0; a
// pulsing orange arrow always points at the finished piece ("push that way").
const W = 560;
const H = 140;
const LOOP = 3400;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ch4Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (ms % LOOP) / LOOP;
      const tau = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // Noise blob ε and finished piece A.
      drawClay(ctx, 110, 98, 0, { color: C.muted, size: 0.9, t: ms / 400 });
      drawClay(ctx, 452, 98, 1, { color: C.green, size: 0.9, t: ms / 700 });

      // The master kneads the τ-blended clay.
      drawPotter(ctx, 280, 106, 1, { mode: 'shape', t: ms / 260, color: C.blue });
      drawClay(ctx, 280, 84, tau, {
        color: lerpColor('#8b95a3', C.green, tau),
        size: 1,
        t: ms / 320,
      });

      // ε flows into the blend; the blend is always pushed toward A.
      drawArrow(ctx, 140, 84, 230, 82, C.muted, 2, 0.5);
      drawArrow(ctx, 322, 76, 412, 76, C.orange, 3, 0.5 + 0.45 * Math.sin(ms / 240));

      drawSceneLabel(ctx, 'ε 噪声', 62, 24, { color: C.muted });
      drawSceneLabel(ctx, 'A 成品', 424, 24, { color: C.green });
      drawLegend(ctx, [['按 τ 糅合', C.orange]], 200, 128);
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

export default Ch4Analogy;
