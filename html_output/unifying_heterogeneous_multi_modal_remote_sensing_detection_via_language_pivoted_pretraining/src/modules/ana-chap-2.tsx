import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-2: 244x130 — three book covers cycle highlight.

const W = 244;
const H = 130;

export const AnaChap2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      const e = (t - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 36, W, 36);

      const cycle = (e * 0.6) % 3;
      const active = Math.floor(cycle);
      const books = [
        { x: 60, color: '#c43f52', label: 'RGB' },
        { x: 122, color: '#228d5c', label: 'SAR' },
        { x: 184, color: '#7c3aed', label: 'IR' },
      ];
      books.forEach((b, i) => {
        const y = H - 28;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 28, y - 22, 56, 44);
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = i === active ? 2.4 : 1.0;
        ctx.strokeRect(b.x - 28, y - 22, 56, 44);
        if (i === active) {
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(b.x - 31, y - 25, 62, 50);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, y);
      });

      // small ink dot at active
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(books[active].x, H - 50, 3, 0, Math.PI * 2);
      ctx.fill();

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

export default AnaChap2;
