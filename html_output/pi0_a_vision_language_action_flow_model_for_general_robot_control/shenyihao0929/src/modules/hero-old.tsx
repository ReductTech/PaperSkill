import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawMoldGrid,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: the mold-grid station. An order card (细颈花瓶) slides
// in; the potter shakes head; a jagged grid-bound vase appears with red verdict.
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
      // order card slides in
      const fly = clamp(t / 0.3, 0, 1);
      const cx = 40 + fly * 150;
      ctx.save();
      ctx.translate(cx, 88);
      ctx.rotate(-0.04);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-52, -22, 104, 44, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('订单：细颈花瓶', 0, 0);
      ctx.restore();
      // mold grid with a jagged vase silhouette snapped to cells
      drawMoldGrid(ctx, 250, 96, 180, 108, 6, 4);
      if (t > 0.35) {
        // jagged neck: staircase polyline in red
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        const pts = [
          [300, 190], [300, 150], [316, 150], [316, 138], [334, 138], [334, 150],
          [350, 150], [350, 190],
        ];
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.stroke();
        ctx.restore();
      }
      // shaking potter
      drawPotter(ctx, 208, 196, 1.5, { mode: 'idle', t: ms / 300, color: C.red });
      if (t > 0.6) drawVerdict(ctx, 250, 66, false, { r: 15, pulse: t * 2 });
      drawSceneLabel(ctx, '模具格子工位', 16, 22, { color: C.red });
      drawSceneLabel(ctx, '离散档位 · 无动作块 · 慢', 16, 42, { color: C.muted });
      drawLegend(ctx, [['锯齿颈口', C.red]], 16, H - 16);
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
