import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeInOutQuad,
} from '../lib/canvasKit';
import { C, drawSceneBg, drawVacBag, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// Ch4 analogy — 真空压缩袋: a bag of fluffy clothes is pumped flat into one
// tight sheet (squish 0 → 1, air puffs escaping the valve), then the small
// high-frequency items are tucked in last on top of the flat bag.
const W = 560;
const H = 140;
const LOOP = 3000;
const BAG_X = 110;
const BAG_W = 200;
const BAG_H = 56;
const FLOOR_Y = 104;

export const Ch4Analogy: React.FC<WidgetProps> = () => {
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

    const miniTee = (x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#efe8fb';
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.roundRect(x - 11, y - 5.5, 22, 11, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // squish timeline: pump 0 → 1, hold flat, snap back for the next loop
      const sq =
        t < 0.72
          ? easeInOutQuad(t / 0.72)
          : t < 0.95
            ? 1
            : 1 - (t - 0.95) / 0.05;
      const bh = BAG_H * (1 - 0.65 * sq);
      const bw = BAG_W * (1 + 0.08 * sq);
      const by = FLOOR_Y - bh;

      // garments inside, flattening together with the bag
      ctx.save();
      ctx.fillStyle = '#d9c7a7';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.25;
      [0, 1].forEach((k) => {
        const iw = 42;
        const ih = Math.max(6, bh * 0.5);
        const ix = BAG_X + 24 + k * 62;
        const iy = by + bh / 2 - ih / 2;
        ctx.beginPath();
        ctx.roundRect(ix, iy, iw, ih, 4);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      drawVacBag(ctx, BAG_X, by, BAG_W, BAG_H, sq);

      // air puffs escaping the valve while pumping
      if (sq > 0.05 && sq < 0.98) {
        ctx.save();
        ctx.strokeStyle = C.green;
        for (let k = 0; k < 3; k++) {
          const p = (ms * 0.0009 + k / 3) % 1;
          const px = BAG_X + bw - 12 + 5 + p * 24;
          const py = by + bh - 8 - p * 16 + k * 3;
          ctx.globalAlpha = (1 - p) * 0.7;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 2 + 5 * p, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // small high-frequency items: one stays, one is tucked in last
      const u = easeInOutQuad(clamp((t - 0.78) / 0.17, 0, 1));
      miniTee(lerp(398, 318, u), lerp(94, 79, u));
      miniTee(428, 88);

      drawSceneLabel(ctx, '抽气压缩', 110, 24, { color: C.green });
      drawSceneLabel(ctx, '高频小件', 400, 56, { color: C.purple });

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

export default Ch4Analogy;
