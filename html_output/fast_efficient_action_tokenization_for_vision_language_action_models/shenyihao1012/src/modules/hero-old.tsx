import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPacker,
  drawSuitcase,
  drawClothes,
  drawLegend,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: the stuffing corner — packer shakes, case overflows
// with loose garments, a mountain of identical tees grows behind.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      // overflowing suitcase
      const fill = 0.6 + t * 0.55;
      drawSuitcase(ctx, 210, 150, 170, 90, { fill01: fill, open: true, color: C.red });
      // shaking packer
      drawPacker(ctx, 168, 208, 1.5, { mode: 'shake', t: ms / 300, color: C.red });
      // mountain of identical tees grows on the right
      const nTee = 4 + Math.round(t * 6);
      drawClothes(ctx, 420, 190, nTee, { color: C.red, seed: 2 });
      drawClothes(ctx, 420, 166, Math.max(0, nTee - 4), { color: C.red, seed: 5 });
      // zip won't close glyph
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const jx = 290;
      const jy = 148 - t * 4;
      ctx.beginPath();
      ctx.moveTo(jx - 10, jy - 4);
      ctx.lineTo(jx + 10, jy + 2);
      ctx.moveTo(jx + 10, jy - 4);
      ctx.lineTo(jx - 10, jy + 2);
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, '塞爆的行李箱', 16, 22, { color: C.red });
      drawSceneLabel(ctx, '逐件硬塞 · 箱子爆开 · 700 件冗余', 16, 42, { color: C.muted });
      drawLegend(ctx, [['同款 T 恤堆', C.red]], 16, H - 16);
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

export default HeroOld;
