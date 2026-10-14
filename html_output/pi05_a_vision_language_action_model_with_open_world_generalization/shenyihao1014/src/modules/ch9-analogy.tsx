import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawCrew, drawLegend, drawSceneLabel } from './movingKit';
import type { WidgetProps } from './registry';

// §9 analogy 「选领班」: seven coach candidates stand in a row and their
// qualitative score cards flip open one by one — the home-trained coach
// (π0.5, green, megaphone) tops the board, the outside GPT-4 consultant
// bottoms it. Card heights are ILLUSTRATIVE ONLY; conclusions follow
// paper Fig 13 (see module 9.1 for the verified ordering).
const W = 560;
const H = 200;
const LOOP = 7200;
const N = 7;

interface Candidate {
  mode: 'coach' | 'work' | 'shrug';
  color: string;
  bar: number; // illustrative height 0..1
}

const CANDIDATES: Candidate[] = [
  { mode: 'coach', color: C.green, bar: 0.96 }, // π0.5 full — best, beats human
  { mode: 'coach', color: '#8a6d3b', bar: 0.86 }, // human oracle — just below π0.5
  { mode: 'work', color: C.blue, bar: 0.74 }, // implicit HL — reads notes, does not call
  { mode: 'coach', color: C.muted, bar: 0.55 }, // no WD
  { mode: 'coach', color: C.muted, bar: 0.52 }, // no VI
  { mode: 'shrug', color: C.muted, bar: 0.3 }, // no HL — significantly worse
  { mode: 'shrug', color: C.red, bar: 0.12 }, // GPT-4 zero-shot — worst
];

export const Ch9Analogy: React.FC<WidgetProps> = () => {
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
      // phase: card i flips open around phase i*0.95, then hold to loop end
      const phase = t * 9.4;
      for (let i = 0; i < N; i++) {
        const x = 48 + i * 78;
        const cd = CANDIDATES[i];
        drawCrew(ctx, x, 170, 0.78, { mode: cd.mode, t: ms / 420 + i, color: cd.color });
        const open = clamp((phase - i * 0.95) / 0.7, 0, 1);
        const cy = 26 + (1 - open) * 24;
        const ch = 58 * open;
        if (ch > 3) {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = cd.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(x - 23, cy, 46, ch, 5);
          ctx.fill();
          ctx.stroke();
          const barH = cd.bar * (ch - 14);
          ctx.fillStyle = cd.color;
          ctx.beginPath();
          ctx.roundRect(x - 16, cy + ch - 6 - barH, 32, barH, 3);
          ctx.fill();
          if (i === 0 && open >= 1) {
            // champion star over the home-trained coach
            ctx.strokeStyle = C.green;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 8);
            ctx.lineTo(x + 4, 14);
            ctx.lineTo(x + 11, 15);
            ctx.lineTo(x + 5, 20);
            ctx.lineTo(x + 7, 27);
            ctx.lineTo(x, 23);
            ctx.lineTo(x - 7, 27);
            ctx.lineTo(x - 5, 20);
            ctx.lineTo(x - 11, 15);
            ctx.lineTo(x - 4, 14);
            ctx.closePath();
            ctx.stroke();
          }
        } else {
          // empty slot while the score card has not flipped yet
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.roundRect(x - 23, 26, 46, 58, 5);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      drawSceneLabel(ctx, '成绩牌依次翻开（示意）', 14, 20, { color: C.muted });
      drawLegend(ctx, [['自家练的领班', C.green], ['外请 GPT-4 顾问', C.red]], 352, 192);
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

export default Ch9Analogy;
