import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawOrderCard,
  drawCookbook,
  drawVerdict,
  drawTokenString,
  drawLegend,
  drawSceneLabel,
} from './chefKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: the cookbook-trained chef — every phrasing (trained,
// paraphrase, novel) gets accepted; a token string streams out and the dish is
// served with a green check.
const W = 520;
const H = 240;
const LOOP = 3400;
const PHASES = [
  { label: '拿可乐' },
  { label: '可乐拿一下' },
  { label: '拿给 Taylor' },
];
const TOKENS = [1, 128, 91, 241, 5, 101, 127, 30];

export const HeroNew: React.FC<WidgetProps> = () => {
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
      const ph = PHASES[idx];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawCookbook(ctx, 78, 196, 1.1);
      // chef consults the book then accepts
      const slide = clamp(t * 3 - idx, 0, 1);
      const ox = -80 + slide * 128;
      drawOrderCard(ctx, 92 + ox, 150, ph.label);
      drawChef(ctx, 300, 196, 1.5, { mode: 'read', t: ms / 400 });
      // action tokens stream below, then a big green verdict
      if (slide >= 0.6) {
        const nTok = Math.ceil(clamp((slide - 0.6) / 0.4, 0, 1) * TOKENS.length);
        drawTokenString(ctx, 300 - (TOKENS.length - 1) * 20, 216, TOKENS.slice(0, nTok), 40);
      }
      if (slide >= 0.9) drawVerdict(ctx, 438, 138, true, { r: 16, pulse: t * 3 });
      // three-order tally strip (top right): all phrasings accepted
      PHASES.forEach((p, i) => {
        const tx = 372 + i * 30;
        ctx.save();
        ctx.globalAlpha = i === idx ? 1 : 0.4;
        ctx.strokeStyle = i === idx ? C.orange : C.border;
        ctx.lineWidth = i === idx ? 2 : 1.25;
        ctx.beginPath();
        ctx.arc(tx, 36, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = C.white;
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', tx, 37);
        ctx.restore();
      });
      drawSceneLabel(ctx, '三单成绩', 352, 36, { color: C.muted, align: 'right' });
      drawSceneLabel(ctx, '读菜谱的新厨师', 16, 22, { color: C.green });
      drawLegend(ctx, [['VLA 5B-55B', C.green], ['未见过 62%', C.muted]], 16, H - 16);
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

export default HeroNew;
