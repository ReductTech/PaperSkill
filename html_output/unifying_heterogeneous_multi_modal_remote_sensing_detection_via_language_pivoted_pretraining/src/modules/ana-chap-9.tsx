import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-9: 244x130 — four concept cards slide in; LVSA-shared is highlighted.

const W = 244;
const H = 130;

export const AnaChap9: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const strategies = [
      { name: 'Baseline', level: 1, color: '#d7deea' },
      { name: 'Concat', level: 3, color: '#c43f52' },
      { name: 'Sum', level: 3, color: '#c43f52' },
      { name: 'Per-Layer', level: 4, color: '#c43f52' },
      { name: 'LVSA-Ours', level: 5, color: '#228d5c' },
    ];

    const render = (t: number) => {
      const e = (t - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const activeIdx = Math.floor((e * 0.5) % strategies.length);
      const cardW = 42;
      const cardH = 80;
      const startX = 12;
      const gap = 4;
      strategies.forEach((s, i) => {
        const x = startX + i * (cardW + gap);
        const y = 16;
        const isActive = i === activeIdx;
        ctx.fillStyle = '#fff7d6';
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeStyle = isActive ? s.color : '#21324a';
        ctx.lineWidth = isActive ? 2.4 : 1.0;
        ctx.strokeRect(x, y, cardW, cardH);
        // big char
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('车', x + cardW / 2, y + 22);
        // detail strokes
        ctx.fillStyle = '#7c3aed';
        ctx.font = '8px "Segoe UI", sans-serif';
        for (let d = 0; d < s.level; d++) {
          ctx.fillText('·', x + 8 + d * 6, y + 42);
        }
        // label
        ctx.fillStyle = '#21324a';
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, x + cardW / 2, y + 62);
        if (isActive) {
          ctx.fillStyle = '#228d5c';
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.fillText('✓', x + cardW / 2, y + 75);
        }
      });

      // caption
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('合并策略 / Merge Strategy', W / 2, H - 8);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => {
      startRef.current = performance.now();
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default AnaChap9;
