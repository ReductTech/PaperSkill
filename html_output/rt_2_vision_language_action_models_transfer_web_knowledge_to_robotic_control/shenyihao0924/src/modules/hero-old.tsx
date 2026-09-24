import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawOrderCard, drawMenuBoard, drawVerdict, drawLegend, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: the closed-set employee — a customer order cycles
// through three phrasings; only the exact trained phrasing matches a menu
// button (blue flash), the paraphrase and novel orders get red crosses.
const W = 520;
const H = 240;
const LOOP = 3400;
// 0 = trained phrasing (match), 1 = paraphrase (miss), 2 = novel semantic (miss)
const PHASES = [
  { label: '拿可乐', match: true },
  { label: '可乐拿一下', match: false },
  { label: '拿给 Taylor', match: false },
];

export const HeroOld: React.FC<WidgetProps> = () => {
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
      // customer order slides in
      const slide = clamp(t * 3 - idx, 0, 1);
      const ox = -80 + slide * 128;
      drawOrderCard(ctx, 92 + ox, 150, ph.label);
      // the employee at the menu board
      drawChef(ctx, 300, 196, 1.5, { mode: ph.match ? 'cook' : 'shake', t: ms / 300, chefColor: C.red });
      drawMenuBoard(ctx, 408, 196, 1.1);
      // big verdict badge over the board
      if (slide >= 0.8) {
        drawVerdict(ctx, 408, 122, ph.match, { r: 16, pulse: t * 3 });
        drawSceneLabel(ctx, ph.match ? '按钮命中' : '无此按钮', 408, 160, {
          color: ph.match ? C.blue : C.red,
          align: 'center',
        });
      }
      // three-order tally strip (top right): trained phrasing hits, others miss
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
        ctx.fillStyle = p.match ? C.green : C.red;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.match ? '✓' : '✗', tx, 37);
        ctx.restore();
      });
      drawSceneLabel(ctx, '三单成绩', 352, 36, { color: C.muted, align: 'right' });
      drawSceneLabel(ctx, '闭集员工', 16, 22, { color: C.red });
      drawLegend(ctx, [['35M 专用模型', C.red], ['未见过 32%', C.muted]], 16, H - 16);
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

export default HeroOld;
