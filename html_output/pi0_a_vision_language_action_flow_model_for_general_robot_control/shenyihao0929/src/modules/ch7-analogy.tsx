import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawCheckMark } from './potteryKit';
import type { WidgetProps } from './registry';

// Ch.7 analogy: the studio technique library. A shelf fills tome by tome while
// the 「广」 plaque glows blue; at the end two gold tomes land and the 「精」
// plaque takes over in green — breadth first, then refinement. Looping.
const W = 560;
const H = 140;
const LOOP = 4600;
const FILL_END = 0.66;
const GOLD_START = 0.7;
const GOLD_END = 0.88;

interface Tome {
  x: number;
  w: number;
  h: number;
  c: string;
}

const GREENS = [C.green, '#39a06e', '#1f7f54'];

const ROW_A: Tome[] = [
  { x: 44, w: 16, h: 41, c: C.blue },
  { x: 63, w: 12, h: 34, c: '#5b7ba3' },
  { x: 78, w: 18, h: 45, c: C.blue },
  { x: 99, w: 13, h: 37, c: '#5b7ba3' },
  { x: 115, w: 16, h: 42, c: C.blue },
  { x: 148, w: 17, h: 44, c: GREENS[0] },
  { x: 168, w: 13, h: 36, c: GREENS[1] },
  { x: 184, w: 19, h: 46, c: GREENS[2] },
  { x: 206, w: 14, h: 39, c: GREENS[0] },
  { x: 223, w: 16, h: 43, c: GREENS[1] },
  { x: 242, w: 18, h: 45, c: GREENS[2] },
  { x: 263, w: 13, h: 37, c: GREENS[0] },
];

const ROW_B: Tome[] = [
  { x: 44, w: 14, h: 38, c: GREENS[1] },
  { x: 61, w: 17, h: 45, c: GREENS[2] },
  { x: 81, w: 12, h: 34, c: GREENS[0] },
  { x: 96, w: 18, h: 46, c: GREENS[1] },
  { x: 117, w: 15, h: 40, c: GREENS[2] },
  { x: 135, w: 19, h: 47, c: GREENS[0] },
  { x: 157, w: 13, h: 36, c: GREENS[1] },
  { x: 173, w: 16, h: 43, c: GREENS[2] },
  { x: 192, w: 14, h: 39, c: GREENS[0] },
  { x: 209, w: 18, h: 46, c: GREENS[1] },
  { x: 230, w: 12, h: 35, c: GREENS[2] },
  { x: 245, w: 15, h: 42, c: GREENS[0] },
  { x: 263, w: 17, h: 44, c: GREENS[1] },
  { x: 284, w: 13, h: 37, c: GREENS[2] },
  { x: 300, w: 16, h: 43, c: GREENS[0] },
];

function drawTome(
  ctx: CanvasRenderingContext2D,
  b: Tome,
  baseY: number,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = b.c;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(b.x, baseY - b.h, b.w, b.h, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + b.w * 0.32, baseY - b.h + 4);
  ctx.lineTo(b.x + b.w * 0.32, baseY - 4);
  ctx.stroke();
  ctx.restore();
}

function drawPlaque(
  ctx: CanvasRenderingContext2D,
  cx: number,
  ch: string,
  color: string,
  lit: boolean,
  pulse: number
) {
  ctx.save();
  // hanging cord
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(cx, 8);
  ctx.lineTo(cx, 24);
  ctx.stroke();
  if (lit) {
    ctx.globalAlpha = 0.28 + 0.14 * Math.sin(pulse * Math.PI * 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, 41, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = lit ? color : '#ffffff';
  ctx.strokeStyle = lit ? color : C.muted;
  ctx.lineWidth = lit ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 15, 26, 30, 30, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = lit ? C.white : C.muted;
  ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, cx, 42);
  ctx.restore();
}

export const Ch7Analogy: React.FC<WidgetProps> = () => {
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
    const all = ROW_A.length + ROW_B.length;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // studio floor line
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(24, 126);
      ctx.lineTo(430, 126);
      ctx.stroke();

      // shelf frame: two compartments over the floor
      ctx.fillStyle = '#efe9dc';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(32, 12, 400, 114, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ground;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      for (const by of [68, 122]) {
        ctx.beginPath();
        ctx.roundRect(36, by, 392, 6, 2);
        ctx.fill();
        ctx.stroke();
      }

      // tomes revealed one by one during the fill phase
      const shown = Math.floor(clamp(t / FILL_END, 0, 1) * all);
      ROW_A.forEach((b, i) => {
        if (i < shown) drawTome(ctx, b, 68);
      });
      ROW_B.forEach((b, i) => {
        if (i + ROW_A.length < shown) drawTome(ctx, b, 122);
      });

      // gold refinement tomes land at the end of row B
      const gold = clamp((t - GOLD_START) / (GOLD_END - GOLD_START), 0, 1);
      if (gold > 0) {
        const dy = (1 - gold) * 26;
        [348, 370].forEach((gx, k) => {
          ctx.save();
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(ms / 260 + k);
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.arc(gx + 8, 100, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          drawTome(
            ctx,
            { x: gx, w: 16, h: 42, c: '#d9a441' },
            122 - dy,
            0.55 + 0.45 * gold
          );
        });
      }

      // the two plaques: 广 lights while pouring in, 精 lights at the end
      drawPlaque(ctx, 468, '广', C.blue, t > 0.04 && t < FILL_END, ms / 300);
      drawPlaque(ctx, 518, '精', C.green, gold > 0.15, ms / 300);
      if (gold >= 1) drawCheckMark(ctx, 493, 96, 8);

      drawSceneLabel(ctx, '手法大库', 14, 20);
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

export default Ch7Analogy;
