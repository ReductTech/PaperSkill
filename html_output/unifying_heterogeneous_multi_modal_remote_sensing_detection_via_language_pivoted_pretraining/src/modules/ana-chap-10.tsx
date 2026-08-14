import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-10: 244x130 — three report cards being filled in.

const W = 244;
const H = 130;

export const AnaChap10: React.FC<WidgetProps> = () => {
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

      const reports = [
        { label: 'SAR', score: 63.3, max: 70, color: '#c43f52' },
        { label: 'DOTA', score: 47.0, max: 70, color: '#228d5c' },
        { label: 'IR', score: 51.3, max: 70, color: '#7c3aed' },
      ];

      const fillProgress = (e % 4) / 4; // 0..1 across 4s

      reports.forEach((r, i) => {
        const x = 20 + i * 72;
        const y = 20;
        const w = 60;
        const h = 80;
        ctx.fillStyle = '#fff7d6';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, w, h);

        // filled progress
        const target = r.score / r.max;
        const filled = target * Math.min(1, fillProgress * 3);
        ctx.fillStyle = r.color;
        ctx.fillRect(x + 4, y + h - 4 - (h - 20) * filled, w - 8, (h - 20) * filled);

        // score label
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.label, x + w / 2, y + 14);
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText(r.score.toFixed(1), x + w / 2, y + 32);

        // tick when full
        if (fillProgress > 0.95) {
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + w - 16, y + 6);
          ctx.lineTo(x + w - 12, y + 12);
          ctx.lineTo(x + w - 6, y + 2);
          ctx.stroke();
        }
      });

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

export default AnaChap10;
