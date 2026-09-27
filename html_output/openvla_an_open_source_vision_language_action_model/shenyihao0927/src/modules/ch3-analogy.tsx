import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawManual,
  drawTokenChip,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// 类比动画（§3）：说明书翻页，小字注记区被逐条划掉、贴上紫色数字口令——
// 撕掉最少人看的小字，改写成动作口令。动体 = 逐条划掉→贴口令的转化序列。
const W = 560;
const H = 140;
const LOOP = 3400;
const CHIP_VALUES = ['004', '042', '128', '199', '231', '255'];
// global coords of the 6 fine-print lines on the open manual (scale 1.6 at 215,100)
const LINES: { x1: number; x2: number; y: number }[] = [
  { x1: 184.6, x2: 207, y: 82.4 },
  { x1: 184.6, x2: 207, y: 93.6 },
  { x1: 184.6, x2: 207, y: 104.8 },
  { x1: 223, x2: 245.4, y: 93.6 },
  { x1: 223, x2: 245.4, y: 104.8 },
  { x1: 223, x2: 245.4, y: 82.4 },
];

export const Ch3Analogy: React.FC<WidgetProps> = () => {
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
      // worker + manual (static props)
      drawWorker(ctx, 55, 118, 1.35, { mode: 'read', t: ms / 300 });
      drawManual(ctx, 215, 100, 1.6);
      // moving subject: fine-print lines struck out one by one
      LINES.forEach((ln, i) => {
        const th = 0.12 + i * 0.11;
        if (t > th) {
          ctx.save();
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.85;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ln.x1 - 3, ln.y);
          ctx.lineTo(ln.x2 + 3, ln.y);
          ctx.stroke();
          ctx.restore();
        }
      });
      // purple numeric command chips pop in, one per scrapped note
      CHIP_VALUES.forEach((v, i) => {
        const th = 0.17 + i * 0.11;
        const k = clamp((t - th) / 0.06, 0, 1);
        if (k <= 0) return;
        const sc = 0.4 + 0.6 * easeOutCubic(k);
        const cx = 352 + (i % 3) * 62;
        const cy = 56 + Math.floor(i / 3) * 46;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        drawTokenChip(ctx, 0, 0, v);
        ctx.restore();
      });
      drawSceneLabel(ctx, '动作口令', 330, 26, { color: C.purple });
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

export default Ch3Analogy;
