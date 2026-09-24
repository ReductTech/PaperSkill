import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawCookbook,
  drawCheckMark,
  drawLegend,
  drawSceneLabel,
} from './chefKit';
import type { WidgetProps } from './registry';

// Chapter 9 analogy card (560x140, auto-loop). Three novel order cards — a
// symbol task (apple -> number plate "3"), an arithmetic task (2+1), and a
// glasses-wearing customer — cycle in. The chef consults the cookbooks, nods,
// and starts cooking: none of these orders were ever on the training menu.
const W = 560;
const H = 140;
const LOOP = 5100;

type Phase = 'symbol' | 'reasoning' | 'person';
const PHASES: Phase[] = ['symbol', 'reasoning', 'person'];

/** Number plate glyph (symbol understanding: "move the apple to 3"). */
function drawNumberPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-13, -19, 26, 38, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.font = 'bold 17px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3', 0, 1);
  ctx.restore();
}

/** Apple glyph. */
function drawApple(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = C.red;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(1, -13);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.ellipse(6, -11, 5, 2.6, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Face glyph; withGlasses adds round glasses (person recognition). */
function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, withGlasses: boolean) {
  ctx.save();
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.text;
  const ex = r * 0.38;
  ctx.beginPath();
  ctx.arc(cx - ex, cy - r * 0.12, 1.4, 0, Math.PI * 2);
  ctx.arc(cx + ex, cy - r * 0.12, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.35, r * 0.4, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
  if (withGlasses) {
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.arc(cx - ex, cy - r * 0.12, r * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + ex, cy - r * 0.12, r * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - ex + r * 0.32, cy - r * 0.12);
    ctx.lineTo(cx + ex - r * 0.32, cy - r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

/** Colored cup glyph (arithmetic / color reasoning). */
function drawCup(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 16);
  ctx.lineTo(cx + 12, cy - 16);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 11);
  ctx.lineTo(cx + 10, cy - 11);
  ctx.stroke();
  ctx.restore();
}

export const Ch9Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const idx = Math.min(2, Math.floor(t * 3));
      const phase = PHASES[idx];
      const p = clamp(t * 3 - idx, 0, 1); // progress inside current phase
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawCookbook(ctx, 92, 106, 0.85);

      // the novel order card slides in
      const slide = clamp(p / 0.3, 0, 1);
      const cx = -90 + slide * 286;
      ctx.save();
      ctx.translate(cx, 58);
      ctx.rotate(-0.03);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-50, -26, 100, 52, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (slide >= 1) {
        if (phase === 'symbol') {
          drawNumberPlate(ctx, cx - 26, 58, 0.9);
          ctx.save();
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 8, 58);
          ctx.lineTo(cx + 8, 58);
          ctx.moveTo(cx + 3, 53);
          ctx.lineTo(cx + 9, 58);
          ctx.lineTo(cx + 3, 63);
          ctx.stroke();
          ctx.restore();
          drawApple(ctx, cx + 28, 60, 1);
        } else if (phase === 'reasoning') {
          ctx.save();
          ctx.fillStyle = C.blue;
          ctx.font = 'bold 17px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('2+1', cx - 22, 56);
          ctx.restore();
          drawCup(ctx, cx + 12, 70, C.red);
          drawCup(ctx, cx + 34, 70, C.green);
        } else {
          drawFace(ctx, cx, 58, 15, true);
        }
      }

      // chef: consult the book, nod, then start cooking
      const nod = p > 0.55 && p <= 0.8 ? Math.abs(Math.sin(ms / 90)) * 2.5 : 0;
      const cooking = p > 0.8;
      drawChef(ctx, 350, 106 - nod, 1.35, {
        mode: cooking ? 'cook' : 'read',
        t: ms / 400,
      });
      if (cooking) drawCheckMark(ctx, 420, 44, 10);

      drawSceneLabel(ctx, '举一反三', 14, 20, { color: C.text });
      drawLegend(ctx, [['认符号', C.orange], ['会算术', C.blue], ['认人脸', C.purple]], 14, H - 12);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch9Analogy;
