import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel } from './potteryKit';
import type { WidgetProps } from './registry';

// Chapter 10 analogy — 出窑: the kiln scoreboard's bars rise, the green
// 「已开窑」 stamp flashes twice, and the 「本店告示」 note stays pinned
// beside the board (works speak, notices get posted too).
const W = 560;
const H = 140;
const LOOP = 4200;

export const Ch10Analogy: React.FC<WidgetProps> = () => {
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

      // scoreboard (static prop 1)
      const bx = 96;
      const by = 24;
      const bw = 196;
      const bh = 88;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();
      // rising score bars (the subject: scores rising out of the kiln)
      const heights = [0.92, 0.68, 0.5];
      heights.forEach((hmax, i) => {
        const p = easeOutCubic(clamp((t - 0.1 - i * 0.1) / 0.32, 0, 1));
        const bh2 = hmax * 60 * p;
        const x = bx + 26 + i * 54;
        ctx.fillStyle = i === 0 ? C.green : C.deep;
        ctx.globalAlpha = i === 0 ? 0.9 : 0.55;
        ctx.beginPath();
        ctx.roundRect(x, by + bh - 14 - bh2, 34, Math.max(bh2, 2), 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // baseline
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(bx + 14, by + bh - 14);
      ctx.lineTo(bx + bw - 14, by + bh - 14);
      ctx.stroke();

      // stamp 「已开窑」 flashes twice, then stays
      if (t > 0.52) {
        const k = clamp((t - 0.52) / 0.34, 0, 1);
        const flash = t < 0.86 ? 0.25 + 0.75 * Math.abs(Math.cos(k * Math.PI * 2)) : 1;
        ctx.save();
        ctx.translate(340, 52);
        ctx.rotate(-0.12);
        ctx.globalAlpha = flash;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-46, -20, 92, 40, 6);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-41, -15, 82, 30, 4);
        ctx.stroke();
        drawSceneLabel(ctx, '已开窑', 0, 0, { color: C.green, align: 'center' });
        ctx.restore();
      }

      // pinned notice 「本店告示」 (static prop 2)
      ctx.save();
      ctx.translate(452, 62);
      ctx.rotate(0.08);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.roundRect(-44, -26, 88, 52, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.support;
      ctx.beginPath();
      ctx.arc(0, -26, 3, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '本店告示', 0, 2, { color: C.text, align: 'center' });
      ctx.restore();

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

export default Ch10Analogy;
