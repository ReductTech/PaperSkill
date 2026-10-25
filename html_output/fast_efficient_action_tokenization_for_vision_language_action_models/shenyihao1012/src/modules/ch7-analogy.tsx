import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { C, drawSceneBg, drawSuitcase, drawVerdict, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// §7 analogy — 「万能收纳术」: a thick packing manual (rounded-rect book +
// spine + scenario tab flags that light up in turn: short / long / hike /
// business / polar) sits beside a carry-on that snaps shut with ease. A
// universal packing method trained over a million packings, applied to any
// luggage as-is (FAST+). Ambient animation, no controls.
const W = 560;
const H = 140;
const LOOP = 3200;

const CLOSE_AT = 0.78;
const CLOSE_DUR = 0.12;
const TABS = [C.orange, C.green, C.blue, C.purple, C.red];

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

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // the manual: cover + spine + open page spread
      ctx.fillStyle = '#e9e2d3';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(48, 38, 212, 66, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(48, 38, 16, 66, 7);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      [0, 1].forEach((k) => {
        ctx.beginPath();
        ctx.roundRect(72 + k * 84, 44, 80, 54, 3);
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(156, 44);
      ctx.lineTo(156, 98);
      ctx.stroke();
      // scribbled page lines
      ctx.strokeStyle = '#c6cfe0';
      [0, 1].forEach((k) => {
        for (let r = 0; r < 4; r++) {
          ctx.beginPath();
          ctx.moveTo(78 + k * 84, 52 + r * 11);
          ctx.lineTo(78 + k * 84 + 46 + (r % 2) * 18, 52 + r * 11);
          ctx.stroke();
        }
      });
      // scenario tabs cycling highlight
      const hot = Math.floor(t * TABS.length) % TABS.length;
      TABS.forEach((col, i) => {
        const on = i === hot;
        ctx.save();
        ctx.translate(254, 50 + i * 11);
        if (on) {
          ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * Math.PI * 2 * 3);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(4, 3, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.translate(on ? 3 : 0, 0);
        ctx.scale(on ? 1.25 : 1, on ? 1.35 : 1);
        ctx.fillStyle = col;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(0, 0, 20, 7, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // the carry-on: open lid snaps shut near the end of the loop
      const closing = t >= CLOSE_AT;
      drawSuitcase(ctx, 372, 54, 116, 52, { fill01: 0.6, open: !closing });
      if (closing) {
        const p = easeInOutQuad(clamp((t - CLOSE_AT) / CLOSE_DUR, 0, 1));
        ctx.save();
        ctx.translate(372, 54);
        ctx.rotate(lerp(-0.5, 0, p));
        ctx.fillStyle = '#f2ecdf';
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-4, -32, 116, 31, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (p >= 1) drawVerdict(ctx, 496, 44, true, { r: 10, pulse: t * 3 });
      }

      drawSceneLabel(ctx, '百万次打包', 50, 26);
      drawSceneLabel(ctx, '直接套用', 308, 22, { align: 'center' });

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
