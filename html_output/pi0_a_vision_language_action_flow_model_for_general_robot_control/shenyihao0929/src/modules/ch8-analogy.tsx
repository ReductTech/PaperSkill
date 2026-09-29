import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawClay, drawWheel, drawCheckMark } from './potteryKit';
import type { WidgetProps } from './registry';

// Ch.8 analogy: the pre-work shop inspection. A magnifier sweeps across the
// desk and lights each tool in turn — order card, clay, wheel, the eye
// master's loupe, the shaping rib. Looping, no controls.
const W = 560;
const H = 140;
const LOOP = 5200;
const SWEEP_START = 0.06;
const SWEEP_END = 0.72;

const ITEMS = [66, 160, 256, 352, 452];

export const Ch8Analogy: React.FC<WidgetProps> = () => {
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

    const drawOrderCard = (x: number) => {
      ctx.save();
      ctx.translate(x, 76);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-23, 0, 46, 32, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, 9);
      ctx.lineTo(15, 9);
      ctx.moveTo(-15, 17);
      ctx.lineTo(6, 17);
      ctx.moveTo(-15, 25);
      ctx.lineTo(11, 25);
      ctx.stroke();
      ctx.restore();
    };

    const drawLoupeTool = (x: number, y: number, r: number) => {
      ctx.save();
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + r * 0.72, y + r * 0.72);
      ctx.lineTo(x + r * 1.7, y + r * 1.7);
      ctx.stroke();
      ctx.restore();
    };

    const drawRib = (x: number) => {
      ctx.save();
      ctx.translate(x, 96);
      ctx.rotate(-0.5);
      ctx.fillStyle = C.support;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-6, -18, 12, 22, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e9e2d3';
      ctx.beginPath();
      ctx.roundRect(-2.5, 4, 5, 12, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      const sweep = clamp((t - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);
      const mx = 30 + sweep * 490;
      const allLit = sweep >= 1;

      ITEMS.forEach((x, i) => {
        const lit = mx > x + 4 || allLit;
        if (lit) {
          ctx.save();
          ctx.globalAlpha = 0.3 + 0.12 * Math.sin(ms / 240 + i);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, 88, 27, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (i === 0) drawOrderCard(x);
        else if (i === 1) drawClay(ctx, x, 98, 0.3, { size: 0.75, t: ms / 600 });
        else if (i === 2) drawWheel(ctx, x, 86, 17, { spin: (ms / 260) % (Math.PI * 2) });
        else if (i === 3) drawLoupeTool(x, 84, 11);
        else drawRib(x);
      });

      // the sweeping magnifier rides above the desk
      if (t < 0.95) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(mx, 58, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawLoupeTool(mx, 58, 19);
        // sight line down to the desk
        ctx.save();
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, 58);
        ctx.lineTo(mx, 74);
        ctx.stroke();
        ctx.restore();
      } else {
        drawCheckMark(ctx, 508, 52, 9);
      }

      drawSceneLabel(ctx, '工坊巡查', 14, 20);
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

export default Ch8Analogy;
