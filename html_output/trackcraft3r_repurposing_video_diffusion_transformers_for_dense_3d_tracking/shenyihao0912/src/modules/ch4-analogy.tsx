import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeOutCubic, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawValueChip } from './dogKit';
import type { WidgetProps } from './registry';

// Ch4 analogy card: a notebook page with two tiny dog marks; a hand writes one
// short displacement arrow between them — nothing else on the page moves.
const W = 560;
const H = 140;
const LOOP = 3000;

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
    const page = { x: 58, y: 16, w: W - 116, h: H - 36 };
    const oldNose = { x: page.x + page.w * 0.58, y: page.y + page.h * 0.56 };
    const newNose = { x: oldNose.x - 78, y: oldNose.y - 26 }; // 向左 0.3 米、向前 0.2 米
    const WRITE = 0.55; // fraction of the loop spent writing the arrow

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // notebook page with ruled lines and a margin
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(page.x, page.y, page.w, page.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      for (let y = page.y + 20; y < page.y + page.h - 8; y += 14) {
        ctx.beginPath();
        ctx.moveTo(page.x + 30, y);
        ctx.lineTo(page.x + page.w - 10, y);
        ctx.stroke();
      }
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(page.x + 22, page.y + 6);
      ctx.lineTo(page.x + 22, page.y + page.h - 6);
      ctx.stroke();
      ctx.restore();
      // two tiny dog marks: old (faint) and new
      ctx.save();
      ctx.globalAlpha = 0.3;
      drawDog(ctx, oldNose.x - 12, oldNose.y + 10, 0.5, { mood: 'idle', t });
      ctx.restore();
      drawDog(ctx, newNose.x - 12, newNose.y + 10, 0.5, { mood: 'idle', t });
      drawTracker(ctx, oldNose.x, oldNose.y, 2.6);
      drawTracker(ctx, newNose.x, newNose.y, 2.6);
      // the pen writes a single displacement arrow between the marks
      const prog = easeOutCubic(clamp(t / WRITE, 0, 1));
      const tip = { x: lerp(oldNose.x, newNose.x, prog), y: lerp(oldNose.y, newNose.y, prog) };
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(oldNose.x + 6, oldNose.y - 4);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      if (prog > 0.92) {
        const ang = Math.atan2(newNose.y - oldNose.y, newNose.x - oldNose.x);
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(newNose.x + 5 * Math.cos(ang), newNose.y + 5 * Math.sin(ang));
        ctx.lineTo(newNose.x - 6 * Math.cos(ang - 0.45), newNose.y - 6 * Math.sin(ang - 0.45));
        ctx.lineTo(newNose.x - 6 * Math.cos(ang + 0.45), newNose.y - 6 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
      }
      if (t < WRITE) {
        // pen glyph riding the tip while writing
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tip.x + 16, tip.y - 24);
        ctx.lineTo(tip.x + 2, tip.y - 2);
        ctx.stroke();
        ctx.fillStyle = C.support;
        ctx.beginPath();
        ctx.arc(tip.x + 17, tip.y - 25, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawValueChip(ctx, (oldNose.x + newNose.x) / 2, (oldNose.y + newNose.y) / 2 - 18, '0.3 m', C.orange);
      }
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
