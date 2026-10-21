import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawCrew, drawSpeechOut, drawSceneLabel } from './movingKit';
import type { WidgetProps } from './registry';

// Ch.2 analogy — 喊单与动手: the coach calls out "捡起盘子！" (blue bubble),
// and the worker immediately bends down to do it (action sequence).
const W = 560;
const H = 140;
const LOOP = 3600;

export const Ch2Analogy: React.FC<WidgetProps> = () => {
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
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // coach with megaphone (high level)
      drawCrew(ctx, 104, 112, 1.35, { mode: 'coach', t: ms / 400, color: C.blue });
      // speech bubble pulsing
      const ba = 0.72 + 0.28 * Math.abs(Math.sin(t * Math.PI * 2));
      ctx.save();
      ctx.globalAlpha = ba;
      drawSpeechOut(ctx, 238, 40, '捡起盘子！', { color: C.blue, w: 118 });
      ctx.restore();
      // conditioning arrow: the call conditions the action
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(288, 52);
      ctx.quadraticCurveTo(330, 62, 362, 84);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(368, 88);
      ctx.lineTo(356, 84);
      ctx.lineTo(362, 74);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // plate on the ground, highlighted as the bubble pulses
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * ba;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(352, 102, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(352, 101, 4.5, 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // worker bending to pick it up (low level)
      drawCrew(ctx, 412, 112, 1.35, { mode: 'work', t: ms / 280, color: C.green });
      drawSceneLabel(ctx, '领班·高层', 58, 18, { color: C.blue });
      drawSceneLabel(ctx, '队员·低层', 424, 18, { color: C.green });
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

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch2Analogy;
