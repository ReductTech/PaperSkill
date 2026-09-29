import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawMoldGrid,
  drawWheel,
  drawClay,
  drawCheckMark,
  drawCrossMark,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch1 analogy: the 细颈花瓶 order card hangs up; the mold grid presses out a
// jagged vase cell by cell (red), while the wheel pulls a smooth silhouette in
// one continuous sweep (green).
const W = 560;
const H = 140;
const LOOP = 3200;

// Jagged neck staircase inside the mold grid (24,48,216,56; 12 cols, 3 rows).
const STAIR: [number, number][] = [
  [60, 102], [60, 80], [78, 80], [78, 70], [96, 70], [96, 80], [114, 80],
  [114, 58], [132, 58], [132, 88], [150, 88], [150, 72], [168, 72], [168, 102],
];

// Cubic bezier sweeping over the wheel (one continuous pull).
const ARC: [number, number][] = [
  [400, 100], [404, 44], [448, 36], [486, 52],
];

function arcPoint(t: number): [number, number] {
  const mt = 1 - t;
  const x =
    mt ** 3 * ARC[0][0] + 3 * mt * mt * t * ARC[1][0] + 3 * mt * t * t * ARC[2][0] + t ** 3 * ARC[3][0];
  const y =
    mt ** 3 * ARC[0][1] + 3 * mt * mt * t * ARC[1][1] + 3 * mt * t * t * ARC[2][1] + t ** 3 * ARC[3][1];
  return [x, y];
}

export const Ch1Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // Order card hangs in from the top.
      const fly = clamp((t - 0.05) / 0.2, 0, 1);
      if (fly > 0) {
        const cy = -16 + fly * 40;
        ctx.save();
        ctx.globalAlpha = fly;
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(280, 0);
        ctx.lineTo(280, cy - 16);
        ctx.stroke();
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(222, cy - 16, 116, 32, 5);
        ctx.fill();
        ctx.stroke();
        drawSceneLabel(ctx, '细颈花瓶×1', 280, cy, { color: C.blue, align: 'center' });
        ctx.restore();
      }

      // Left: mold grid presses a jagged vase, segment by segment.
      drawMoldGrid(ctx, 24, 48, 216, 56, 12, 3);
      const stairProg = clamp((t - 0.3) / 0.45, 0, 1);
      const segs = stairProg * (STAIR.length - 1);
      if (segs > 0) {
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(STAIR[0][0], STAIR[0][1]);
        const n = Math.ceil(segs);
        for (let i = 1; i <= n && i < STAIR.length; i++) {
          const f = clamp(segs - (i - 1), 0, 1);
          const px = STAIR[i - 1][0] + (STAIR[i][0] - STAIR[i - 1][0]) * f;
          const py = STAIR[i - 1][1] + (STAIR[i][1] - STAIR[i - 1][1]) * f;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Right: the wheel spins and pulls a smooth vase in one sweep.
      const pull = clamp((t - 0.35) / 0.5, 0, 1);
      drawWheel(ctx, 466, 80, 28, { spin: ms / 450 });
      if (pull > 0) {
        drawClay(ctx, 466, 66, pull, { size: 0.95, t: ms / 500 });
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const [sx, sy] = arcPoint(0);
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= 30; i++) {
          const u = (i / 30) * pull;
          const [px, py] = arcPoint(u);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Verdict marks once both sides are done.
      if (t > 0.82) {
        drawCrossMark(ctx, 252, 64, 8);
        drawCheckMark(ctx, 514, 62, 9);
      }

      drawLegend(ctx, [['模具·锯齿', C.red], ['转盘·流畅', C.green]], 16, 128);
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

export default Ch1Analogy;
