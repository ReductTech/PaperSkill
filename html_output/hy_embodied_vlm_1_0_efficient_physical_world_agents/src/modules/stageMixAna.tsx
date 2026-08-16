import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

// Chapter 3 analogy: three parallel recipes feed one model.
// Pre-training / SFT / RL are different mixtures, not one beam filtered three times.
const W = 244;
const H = 130;

export const StageMixAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const stages = [
        { x: 62, color: C.blue, name: '预训练' },
        { x: 122, color: C.orange, name: 'SFT' },
        { x: 182, color: C.green, name: 'RL' },
      ];
      // three beakers
      stages.forEach((st, i) => {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(st.x - 15, 44, 30, 48);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(st.x - 15, 44, 30, 48);
        const fill = 0.35 + 0.25 * Math.sin(t * 1.8 + i);
        ctx.fillStyle = st.color;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(st.x - 13, 90 - fill * 42, 26, fill * 42 + 2);
        ctx.globalAlpha = 1;
        // drops from different source colors
        const dropY = 28 + ((t * 22 + i * 13) % 18);
        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.arc(st.x, dropY, 3, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, st.name, st.x, 104, 9, st.color);
      });
      // one shared model block below
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(84, 112, 76, 12);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.strokeRect(84, 112, 76, 12);
      label(ctx, '同一个模型', 122, 118, 8, C.purple);
      label(ctx, '三份配方，分阶段供给', W / 2, 18, 10, C.ink);
    };
    const t0 = performance.now();
    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} aria-label="三份配方分阶段供给类比动画" />;
};

export default StageMixAna;
