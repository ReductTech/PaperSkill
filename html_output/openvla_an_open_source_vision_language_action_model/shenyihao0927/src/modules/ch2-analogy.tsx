import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawRuler,
  drawCheckMark,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// 类比动画（§2）：两把尺并排量同一块板材——蓝尺（语义）打勾认出搁板，
// 橙尺（空间）量准孔位。一个动体（来回扫动的双尺），两个静物（板材 + 组装工）。
const W = 560;
const H = 140;
const LOOP = 3200;
const HOLES = [185, 240, 295, 350];

export const Ch2Analogy: React.FC<WidgetProps> = () => {
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
      // board with drilled holes (static prop 1)
      ctx.save();
      ctx.fillStyle = '#d9c7a7';
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(130, 88, 330, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.deep;
      HOLES.forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, 95, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      // worker reading the readings (static prop 2)
      drawWorker(ctx, 55, 120, 1.35, { mode: 'read', t: ms / 300 });
      // the moving subject: sweeping pair of rulers
      const p = (Math.sin(ms / 800 - Math.PI / 2) + 1) / 2;
      const rx = 140 + p * 170;
      drawRuler(ctx, rx, 52, 150, { semantic: true });
      drawRuler(ctx, rx, 74, 150);
      // semantic check: "this is a shelf"
      drawCheckMark(ctx, rx + 164, 52, 7);
      // spatial drop-line to the measured hole
      const mx = rx + 75;
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, 80);
      ctx.lineTo(mx, 87);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // ring the hole currently under the spatial ruler
      let nearest = -1;
      let best = 26;
      HOLES.forEach((hx, i) => {
        const d = Math.abs(hx - mx);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
      if (nearest >= 0) {
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(HOLES[nearest], 95, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // steady breathing of the scene (keeps loop alive at hold)
      if (t > 0.98) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = C.blue;
        ctx.fillRect(130, 88, 330, 14);
        ctx.restore();
      }
      drawSceneLabel(ctx, '语义尺', 492, 52, { color: C.blue });
      drawSceneLabel(ctx, '空间尺', 492, 74, { color: C.orange });
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

export default Ch2Analogy;
