import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawClay,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch3 analogy: the wheel keeps spinning while the clay outline morphs from a
// noise blob to a vase (drawClay 0 -> 1, looping); an orange τ progress bar
// tracks the flow time.
const W = 560;
const H = 140;
const LOOP = 3000;

export const Ch3Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // Flow time: form over the first 72%, hold, then the loop restarts.
      const s = t < 0.72 ? easeInOutQuad(t / 0.72) : 1;

      drawWheel(ctx, 300, 78, 30, { spin: ms / 420 });
      drawClay(ctx, 300, 64, s, { size: 1.05, t: ms / 500 });

      // Orange τ progress bar under the two endpoint labels.
      const bx = 170;
      const bw = 220;
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, 30);
      ctx.lineTo(bx + bw, 30);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(bx, 30);
      ctx.lineTo(bx + bw * s, 30);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(bx + bw * s, 30, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawSceneLabel(ctx, '噪声泥团', 16, 30, { color: C.muted });
      drawSceneLabel(ctx, '成形动作', 470, 30, { color: C.green });
      drawLegend(ctx, [['τ 流时间', C.orange]], 16, 128);
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

export default Ch3Analogy;
