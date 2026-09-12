import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawCamcorder, drawLegend } from './dogKit';
import type { WidgetProps } from './registry';

// §8 analogy card — 出包检查: a magnifier sweeps left→right over a flat-lay
// gear mat (camcorder, lens cap, battery, card); each item glows briefly as the
// lens passes over it and stays lit once checked.
const W = 560;
const H = 140;
const LOOP = 3000;
const Y = 88;

type Kind = 'cam' | 'cap' | 'bat' | 'card';
const ITEMS: { x: number; kind: Kind }[] = [
  { x: 130, kind: 'cam' },
  { x: 228, kind: 'cap' },
  { x: 326, kind: 'bat' },
  { x: 424, kind: 'card' },
];

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

    const drawItem = (x: number, kind: Kind) => {
      if (kind === 'cam') {
        drawCamcorder(ctx, x - 13, Y, { scale: 0.95 });
      } else if (kind === 'cap') {
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(x, Y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, Y, 7, 0, Math.PI * 2);
        ctx.stroke();
      } else if (kind === 'bat') {
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 15, Y - 8, 28, 16, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(x + 13, Y - 4, 5, 8, 1);
        ctx.fill();
      } else {
        ctx.fillStyle = '#f3edfd';
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 14, Y - 9, 28, 18, 3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 14, Y - 3);
        ctx.lineTo(x - 22, Y - 3);
        ctx.stroke();
      }
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      const mx = 58 + t * 444;
      const my = 46 + Math.sin(ms / 260) * 3;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // the flat-lay gear mat
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(74, 58, 412, 58, 10);
      ctx.fill();
      ctx.stroke();
      ITEMS.forEach((it) => {
        const pulse = Math.exp(-Math.pow((mx - it.x) / 34, 2));
        const passed = mx > it.x + 18;
        // brief glow while the lens is over the item
        if (pulse > 0.02) {
          ctx.save();
          ctx.globalAlpha = 0.32 * pulse;
          ctx.fillStyle = C.green;
          ctx.beginPath();
          ctx.arc(it.x, Y, 27, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // stays lit once checked
        if (passed) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(it.x, Y, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        drawItem(it.x, it.kind);
      });
      // the magnifier (lens + handle)
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx + 10, my + 10);
      ctx.lineTo(mx + 25, my + 25);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(mx, my, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 9, -Math.PI * 0.85, -Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
      drawLegend(ctx, [['已检查', C.green], ['放大镜', C.blue]], 14, H - 14);
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
