import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 244;
const H = 130;

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, text: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  label(ctx, text, x + w / 2, y + h / 2, 8, '#ffffff');
}

export const TeacherAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const cyc = t % 6.0;
      if (cyc < 1.5) {
        // RL teacher generates many candidate sheets
        card(ctx, 22, 52, 44, 34, C.blue, 'RL');
        const g = Math.min(1, cyc / 1.2);
        for (let i = 0; i < 5; i += 1) {
          const x = 78 + i * 26;
          const y = 44 + ((t * 24 + i * 19) % 44);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, 20, 26);
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, 20, 26);
        }
        label(ctx, '老师大量解题', W / 2, 16, 10, C.blue);
      } else if (cyc < 2.7) {
        // filter keeps only selected sheets
        card(ctx, 22, 52, 44, 34, C.blue, 'RL');
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(88, 58, 110, 50);
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(98 + i * 32, 72, 22, 26);
          ctx.strokeStyle = C.green;
          ctx.strokeRect(98 + i * 32, 72, 22, 26);
        }
        label(ctx, '奖励 · critic · 一致性筛选', W / 2, 16, 10, C.green);
      } else if (cyc < 4.1) {
        // pre-trained student re-learns from the selected textbook
        card(ctx, 22, 52, 44, 34, C.green, 'θ_pt');
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(88, 58, 110, 50);
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(98 + i * 32, 72, 22, 26);
          ctx.strokeStyle = C.orange;
          ctx.strokeRect(98 + i * 32, 72, 22, 26);
        }
        label(ctx, '预训练底座重新学教材', W / 2, 16, 10, C.orange);
      } else {
        // two specialist books merge into one final model
        card(ctx, 40, 50, 52, 34, C.purple, '连续');
        card(ctx, 150, 50, 52, 34, C.purple, '离散');
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(121, 96, 22, 0, Math.PI * 2);
        ctx.stroke();
        label(ctx, '融合 θ_final', 121, 96, 8, C.green);
        label(ctx, '两个专门化模型，不是 MoE 专家', W / 2, 16, 10, C.purple);
      }
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
  return <canvas ref={ref} width={W} height={H} aria-label="老师出题学生重学训练类比动画" />;
};

export default TeacherAna;
