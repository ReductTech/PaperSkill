import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawValueChip, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// §8 analogy — 「省箱榜」: four wooden plaques flip open in order
// (5/15/20/50Hz → short / medium / long / ultra-long trips); each shows a
// pair of cases, big (unpacked) vs small (after the vac bag). The longer
// the trip (higher the frequency), the more the compression bag saves —
// the last plaque flashes gold at 13.2×. Ambient animation, no controls.
const W = 560;
const H = 140;
const LOOP = 3200;

const PLAQUES = [
  { cx: 100, at: 0.06, big: 30, small: 22 },
  { cx: 230, at: 0.22, big: 34, small: 18 },
  { cx: 360, at: 0.38, big: 38, small: 14 },
  { cx: 490, at: 0.54, big: 42, small: 10 },
];

function miniCase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  w: number,
  h: number,
  stroke: string,
  fill: string
) {
  // tiny suitcase silhouette anchored at its bottom edge
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, bottom - h, w, h, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 4, bottom - h);
  ctx.quadraticCurveTo(cx, bottom - h - 5, cx + 4, bottom - h);
  ctx.stroke();
}

function drawPlaque(
  ctx: CanvasRenderingContext2D,
  cx: number,
  big: number,
  small: number,
  gold: boolean
) {
  // wooden board; gold trim on the champion (ultra-long) plaque
  ctx.fillStyle = '#e6d3ab';
  ctx.strokeStyle = gold ? C.orange : C.support;
  ctx.lineWidth = gold ? 2.5 : 2;
  ctx.beginPath();
  ctx.roundRect(cx - 52, 48, 104, 62, 7);
  ctx.fill();
  ctx.stroke();
  // big case (unpacked) vs small case (after compression), bottoms aligned
  miniCase(ctx, cx - 20, 98, big, big * 0.66, C.red, '#efe6da');
  miniCase(ctx, cx + 22, 98, small, Math.max(7, small * 0.66), C.green, '#dcefe4');
}

export const Ch8Analogy: React.FC<WidgetProps> = () => {
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

      // hanging rail
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(44, 30);
      ctx.lineTo(516, 30);
      ctx.stroke();

      PLAQUES.forEach((pl, i) => {
        const p = clamp((t - pl.at) / 0.12, 0, 1);
        if (p <= 0) return;
        const e = easeOutCubic(p);
        // strings from the rail
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.35 + 0.65 * e;
        ctx.beginPath();
        ctx.moveTo(pl.cx - 34, 30);
        ctx.lineTo(pl.cx - 30, 48);
        ctx.moveTo(pl.cx + 34, 30);
        ctx.lineTo(pl.cx + 30, 48);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // gold glow behind the champion plaque
        if (i === 3 && t > 0.7) {
          ctx.globalAlpha = 0.16 + 0.12 * Math.sin(t * Math.PI * 2 * 2.5);
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.roundRect(pl.cx - 60, 42, 120, 74, 10);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        // flip open around the vertical axis
        ctx.save();
        ctx.translate(pl.cx, 0);
        ctx.scale(Math.max(0.03, e), 1);
        ctx.globalAlpha = 0.3 + 0.7 * e;
        drawPlaque(ctx, 0, pl.big, pl.small, i === 3);
        ctx.restore();
      });

      if (t > 0.72) {
        const cp = easeOutCubic(clamp((t - 0.72) / 0.1, 0, 1));
        ctx.globalAlpha = cp;
        drawValueChip(ctx, 490, 44, '13.2×', C.orange);
        ctx.globalAlpha = 1;
      }

      drawSceneLabel(ctx, '越长越省', 56, 18);

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

export default Ch8Analogy;
