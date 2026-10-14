import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawNotebook,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.8 analogy — three swim lanes, same distance and same fuel: the π0.5 crew
// (having read the five study notebooks) finishes first, π0-FAST+Flow second,
// π0 (pure diffusion) last. Qualitative race, no numbers.
const W = 520;
const H = 240;
const LOOP = 5400;
const START_X = 46;
const FINISH_X = 418;
const FLAG_X = 440;

const LANES = [
  { color: C.green, y: 96, dur: 0.6 },
  { color: C.blue, y: 152, dur: 0.84 },
  { color: C.red, y: 208, dur: 0.98 },
];
const TAGS = ['MM', 'ME', 'CE', 'HL', 'WD'];
const NCOLORS = [C.blue, C.blue, C.blue, C.orange, C.purple];

export const Ch8Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      drawSceneBg(ctx, W, H, { ground: false });

      // lane tracks
      LANES.forEach((lane) => {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(24, lane.y + 4);
        ctx.lineTo(FINISH_X + 34, lane.y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // finish flag (checkered)
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(FLAG_X, 34);
      ctx.lineTo(FLAG_X, 216);
      ctx.stroke();
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? C.text : C.white;
          ctx.fillRect(FLAG_X + 2 + c * 10, 34 + r * 10, 10, 10);
        }
      }
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1;
      ctx.strokeRect(FLAG_X + 2, 34, 30, 20);

      // racers
      let greenDone = false;
      LANES.forEach((lane, i) => {
        const prog = clamp((t - 0.02) / lane.dur, 0, 1);
        const e = easeOutCubic(prog);
        const x = START_X + e * (FINISH_X - START_X);
        const bob = Math.sin(ms / 140 + i * 1.7) * 2.5;
        // speed trails
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = lane.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 22, lane.y - 10 + bob);
        ctx.lineTo(x - 34, lane.y - 10 + bob);
        ctx.moveTo(x - 18, lane.y - 2 + bob);
        ctx.lineTo(x - 28, lane.y - 2 + bob);
        ctx.stroke();
        ctx.restore();
        drawCrew(ctx, x, lane.y + bob, 1.35, { mode: 'work', t: ms / 200, color: lane.color });
        if (i === 0) {
          greenDone = prog >= 1;
          // the five study notebooks trail behind the π0.5 crew
          TAGS.forEach((tag, k) => {
            const nx = Math.max(16, x - 34 - k * 24);
            const ny = 44 + Math.sin(ms / 300 + k) * 3;
            drawNotebook(ctx, nx, ny, 0.42, tag, { color: NCOLORS[k] });
          });
        }
      });
      if (greenDone) drawVerdict(ctx, 472, 72, true, { r: 13, pulse: t * 3 });

      drawSceneLabel(ctx, '同数据 · 同算力', 24, 26, { color: C.muted });
      drawSceneLabel(ctx, '终点', FLAG_X + 17, 22, { color: C.muted, align: 'center' });
      drawLegend(
        ctx,
        [
          ['π0.5 读过功课', C.green],
          ['π0-FAST+Flow', C.blue],
          ['π0 纯扩散', C.red],
        ],
        24,
        232
      );

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

export default Ch8Analogy;
