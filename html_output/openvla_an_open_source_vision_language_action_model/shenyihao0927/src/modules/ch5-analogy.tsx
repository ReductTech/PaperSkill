import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawBox,
  drawCrossMark,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
} from './flatKit';
import type { WidgetProps } from './registry';

// Chapter 5 analogy — the parts-swap meet (OXE curation): 70+ booths pour parts
// into a big funnel; off-spec parts are screened out at the mesh, good parts are
// mixed by recipe and boxed as 970k. Auto-looping 560x140 canvas, no controls.
const W = 560;
const H = 140;
const LOOP = 4600;

// Funnel geometry (centered at fx).
const FX = 272;
const MOUTH_Y = 46;
const MOUTH_HALF = 80;
const NECK_Y = 90;
const NECK_HALF = 12;
const MESH_Y = 76;
const SPOUT_Y = 100;

interface Part {
  bx: number; // booth x origin
  d: number; // schedule offset within the loop (0..0.5)
  good: boolean;
  pileX: number; // reject landing x
}

const PARTS: Part[] = [
  { bx: 34, d: 0.0, good: true, pileX: 0 },
  { bx: 64, d: 0.06, good: true, pileX: 0 },
  { bx: 94, d: 0.12, good: false, pileX: 96 },
  { bx: 124, d: 0.18, good: true, pileX: 0 },
  { bx: 46, d: 0.26, good: true, pileX: 0 },
  { bx: 76, d: 0.32, good: false, pileX: 132 },
  { bx: 106, d: 0.4, good: true, pileX: 0 },
  { bx: 60, d: 0.46, good: true, pileX: 0 },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function halfWidthAt(y: number): number {
  const t = clamp((y - MOUTH_Y) / (NECK_Y - MOUTH_Y), 0, 1);
  return lerp(MOUTH_HALF, NECK_HALF, t);
}

function drawFunnel(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(FX - MOUTH_HALF, MOUTH_Y);
  ctx.lineTo(FX - NECK_HALF, NECK_Y);
  ctx.lineTo(FX - NECK_HALF - 2, SPOUT_Y);
  ctx.lineTo(FX + NECK_HALF + 2, SPOUT_Y);
  ctx.lineTo(FX + NECK_HALF, NECK_Y);
  ctx.lineTo(FX + MOUTH_HALF, MOUTH_Y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // mouth rim
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(FX - MOUTH_HALF - 4, MOUTH_Y);
  ctx.lineTo(FX + MOUTH_HALF + 4, MOUTH_Y);
  ctx.stroke();
  // filter mesh across the neck
  const hw = halfWidthAt(MESH_Y);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const seg = 8;
  for (let i = 0; i <= seg; i++) {
    const x = FX - hw + (2 * hw * i) / seg;
    const y = MESH_Y + (i % 2 === 0 ? -3 : 3);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBooths(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const xs = [34, 76, 118];
  xs.forEach((x, i) => {
    ctx.fillStyle = i === 1 ? C.orange : C.deep;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x - 14, 34);
    ctx.lineTo(x, 22);
    ctx.lineTo(x + 14, 34);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, 34);
    ctx.lineTo(x - 12, 40);
    ctx.moveTo(x + 12, 34);
    ctx.lineTo(x + 12, 40);
    ctx.stroke();
  });
  ctx.restore();
}

/** Position of one part at loop-normalized time t; null before start / after done. */
function partState(p: Part, t: number): { x: number; y: number; gone: boolean; landed: boolean } {
  const u = t - p.d;
  if (u < 0 || u > 0.86) return { x: 0, y: 0, gone: true, landed: false };
  if (u < 0.34) {
    const e = u / 0.34;
    return { x: lerp(p.bx, FX, e), y: lerp(24, MOUTH_Y + 8, e), gone: false, landed: false };
  }
  if (u < 0.45) {
    const e = (u - 0.34) / 0.11;
    return { x: FX, y: lerp(MOUTH_Y + 8, MESH_Y, e), gone: false, landed: false };
  }
  if (p.good) {
    if (u < 0.55) {
      const e = (u - 0.45) / 0.1;
      return { x: FX, y: lerp(MESH_Y, SPOUT_Y, e), gone: false, landed: false };
    }
    if (u < 0.72) {
      const e = (u - 0.55) / 0.17;
      return {
        x: lerp(FX, 452, e),
        y: 104 - Math.sin(Math.PI * e) * 12,
        gone: false,
        landed: false,
      };
    }
    return { x: 0, y: 0, gone: true, landed: true };
  }
  if (u < 0.64) {
    const e = (u - 0.45) / 0.19;
    return {
      x: lerp(FX - 20, p.pileX, e),
      y: MESH_Y + Math.sin(Math.PI * e) * -14 + e * (112 - MESH_Y),
      gone: false,
      landed: false,
    };
  }
  return { x: p.pileX, y: 112, gone: false, landed: true };
}

export const Ch5Analogy: React.FC<WidgetProps> = () => {
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
      drawBooths(ctx);
      drawFunnel(ctx);
      // the packing box
      drawBox(ctx, 466, 122, 0.95);

      // parts in flight + landed rejects
      let landedGood = 0;
      const landedBad: number[] = [];
      PARTS.forEach((p) => {
        const s = partState(p, t);
        if (s.landed && p.good) {
          landedGood++;
          return;
        }
        if (s.landed && !p.good) {
          landedBad.push(s.x);
          return;
        }
        if (s.gone) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(p.good ? 0 : 0.35);
        ctx.fillStyle = p.good ? C.green : C.red;
        ctx.strokeStyle = p.good ? C.deep : C.red;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(-5, -5, 10, 10, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (!p.good) drawCrossMark(ctx, s.x, s.y, 5);
      });
      // static landed rejects keep their cross
      landedBad.forEach((x) => {
        ctx.save();
        ctx.fillStyle = C.red;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(x - 5, 107, 10, 10, 2);
        ctx.fill();
        ctx.restore();
        drawCrossMark(ctx, x, 112, 5);
      });
      // parts that made it into the box
      for (let i = 0; i < landedGood; i++) {
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(448 + i * 8, 96, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // 970k badge pops once the box starts filling
      if (t > 0.55) {
        const pop = clamp((t - 0.55) / 0.08, 0, 1);
        ctx.save();
        ctx.translate(466, 76);
        ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
        drawValueChip(ctx, 0, 0, '970k', C.green);
        ctx.restore();
      }

      drawSceneLabel(ctx, '零件交换大会', 14, 16, { color: C.green });
      drawSceneLabel(ctx, '70+ 摊位 · 200万+ 件', 14, 130, { color: C.muted });
      drawLegend(
        ctx,
        [
          ['合格入库', C.green],
          ['筛掉', C.red],
        ],
        330,
        130
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

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch5Analogy;
