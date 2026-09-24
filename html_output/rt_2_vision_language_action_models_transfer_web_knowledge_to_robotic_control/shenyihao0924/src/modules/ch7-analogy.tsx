import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawCheckMark, drawLegend, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Ch.7 analogy (560x140, auto-loop): the master's demo is the textbook —
// the apprentice plays word-chain, completing the command tokens one by one.
// First k tokens lit purple, the next one flashes "?", the rest stay covered.
const W = 560;
const H = 140;
const LOOP = 4800;
const TOKENS = ['1', '128', '91', '241', '5', '101', '127'];

function tok(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: string,
  fill: string,
  opts?: { scale?: number; alpha?: number; text?: string }
) {
  const s = opts?.scale ?? 1;
  ctx.save();
  ctx.globalAlpha = opts?.alpha ?? 1;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-16, -12, 32, 24, 5);
  ctx.fill();
  ctx.fillStyle = opts?.text ?? C.white;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(v, 0, 1);
  ctx.restore();
}

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
      const beat = t * 8; // 7 reveals + 1 hold with the check mark
      const k = Math.min(TOKENS.length, Math.floor(beat));
      const pop = clamp((beat - k) * 3, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // the master (silhouette) presenting the demo paper, the apprentice completing
      drawChef(ctx, 62, 116, 1.3, { mode: 'read', t: ms / 500, chefColor: C.deep });
      drawChef(ctx, 498, 116, 1.3, { mode: 'cook', t: ms / 500 });
      // the demo paper
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(104, 30, 352, 66, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const x0 = 280 - (6 * 44) / 2;
      for (let i = 0; i < TOKENS.length; i++) {
        const x = x0 + i * 44;
        if (i < k) {
          const s = i === k - 1 ? 0.7 + 0.3 * pop : 1;
          tok(ctx, x, 63, TOKENS[i], C.purple, { scale: s });
        } else if (i === k && k < TOKENS.length) {
          const blink = 0.5 + 0.5 * Math.sin(ms / 130);
          tok(ctx, x, 63, '?', C.orange, { scale: 0.92 + 0.1 * blink, alpha: 0.55 + 0.45 * blink });
        } else {
          tok(ctx, x, 63, '?', C.border, { text: C.muted });
        }
      }
      if (k >= TOKENS.length) drawCheckMark(ctx, 442, 63, 10);

      drawSceneLabel(ctx, '师傅示范', 30, 22, { color: C.muted });
      drawSceneLabel(ctx, '学徒接龙', 530, 22, { align: 'right' });
      drawLegend(ctx, [['已补全', C.purple], ['待猜', C.orange]], 104, 129);
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
