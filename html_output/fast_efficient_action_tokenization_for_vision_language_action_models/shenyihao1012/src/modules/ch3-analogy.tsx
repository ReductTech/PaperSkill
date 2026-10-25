import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSuitcase,
  drawClothes,
  drawVacBag,
  drawRolled,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch3 analogy — 塞 vs 压缩打包: on the left a big case bursting with a fluffy
// unstuffed pile (red, many); on the right a flat vacuum bag, neat rolls and a
// small half-full carry-on (green, few). A quiet balance slowly tips green.
const W = 560;
const H = 140;
const LOOP = 3600;
const PIVOT_X = 280;
const PIVOT_Y = 70;
const BEAM_HALF = 74;

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

    const miniTee = (x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#f6e3e6';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 4.5, 18, 9, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const pan = (x: number, y: number, color: string) => {
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x - 13, y);
      ctx.lineTo(x - 4, y - 15);
      ctx.moveTo(x + 13, y);
      ctx.lineTo(x + 4, y - 15);
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // left — naive stuffing: loose pile + big overfilled case (red, many)
      drawClothes(ctx, 120, 98, 2, { color: C.red });
      drawSuitcase(ctx, 18, 60, 100, 44, { fill01: 1.15, open: true, color: C.red });

      // right — compressed packing: flat vac bag + rolls + small carry-on (green, few)
      drawVacBag(ctx, 378, 95.6, 56, 24, 1);
      drawRolled(ctx, 384, 90, 2, { size: 0.7 });
      drawSuitcase(ctx, 452, 66, 100, 34, { fill01: 0.5, open: true, color: C.green });

      // the balance gently tips toward the green side
      const a = 0.12 * easeOutCubic(clamp(t / 0.55, 0, 1));
      ctx.save();
      // fulcrum
      ctx.fillStyle = C.ground;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PIVOT_X, PIVOT_Y);
      ctx.lineTo(PIVOT_X - 12, H - 34);
      ctx.lineTo(PIVOT_X + 12, H - 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // beam
      ctx.translate(PIVOT_X, PIVOT_Y);
      ctx.rotate(a);
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-BEAM_HALF, 0);
      ctx.lineTo(BEAM_HALF, 0);
      ctx.stroke();
      ctx.fillStyle = C.deep;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // hanging pans: heavy red pile vs one compact green roll
      const lx = PIVOT_X - BEAM_HALF * Math.cos(a);
      const ly = PIVOT_Y - BEAM_HALF * Math.sin(a);
      const rx = PIVOT_X + BEAM_HALF * Math.cos(a);
      const ry = PIVOT_Y + BEAM_HALF * Math.sin(a);
      const lpy = ly + 15;
      const rpy = ry + 15;
      pan(lx, lpy, C.red);
      miniTee(lx, lpy - 5);
      miniTee(lx, lpy - 14);
      pan(rx, rpy, C.green);
      drawRolled(ctx, rx - 6, rpy - 5, 1, { size: 0.6 });

      drawSceneLabel(ctx, '硬塞', 16, 22, { color: C.red });
      drawSceneLabel(ctx, '压缩打包', 544, 22, { color: C.green, align: 'right' });

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
