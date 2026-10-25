import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPacker,
  drawSuitcase,
  drawVacBag,
  drawRolled,
  drawPouch,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: the compression counter — garments get rolled and
// vacuum-sealed, a pouch swallows the smalls, one carry-on clicks shut.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroNew: React.FC<WidgetProps> = () => {
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
      // calm packer rolling garments
      drawPacker(ctx, 120, 208, 1.5, { mode: 'roll', t: ms / 260, color: C.green });
      // vacuum bag squishing flat (DCT)
      const squish = clamp((t - 0.1) / 0.5, 0, 1);
      drawVacBag(ctx, 170, 120, 130, 64, squish);
      drawSceneLabel(ctx, 'DCT', 235, 100, { color: C.green, align: 'center' });
      // neat rolls appearing (compressed tokens)
      const nRoll = Math.round(clamp((t - 0.4) / 0.4, 0, 1) * 6);
      drawRolled(ctx, 330, 130, nRoll, { color: C.purple, size: 1.1 });
      // pouch merging smalls (BPE)
      if (t > 0.55) drawPouch(ctx, 330, 165, 110, 5);
      drawSceneLabel(ctx, 'BPE', 385, 152, { color: C.purple, align: 'center' });
      // carry-on clicks shut
      if (t > 0.75) {
        drawSuitcase(ctx, 330, 178, 150, 52, { fill01: 0.55, open: false, color: C.green });
        drawVerdict(ctx, 490, 168, true, { r: 15, pulse: t * 2 });
      }
      drawSceneLabel(ctx, '压缩打包台', 16, 22, { color: C.green });
      drawSceneLabel(ctx, 'DCT+BPE · ~30 件 · 收拾快 5×', 16, 42, { color: C.muted });
      drawLegend(ctx, [['压缩袋', C.green], ['衣物卷', C.purple]], 16, H - 16);
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

export default HeroNew;
