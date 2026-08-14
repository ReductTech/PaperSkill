import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-6: 244x130 — tutor ticks off three books one by one.

const W = 244;
const H = 130;

export const AnaChap6: React.FC<WidgetProps> = () => {
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

      // checklist card on the left
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(20, 16, 80, 90);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(20, 16, 80, 90);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('微调 ✓', 26, 22);

      const items = ['RGB', 'SAR', 'IR'];
      const tickAt = [1.0, 2.0, 3.0];
      items.forEach((it, i) => {
        const y = 42 + i * 22;
        // tick
        const ticked = e > tickAt[i];
        ctx.strokeStyle = ticked ? '#228d5c' : '#d7deea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(28, y + 4);
        ctx.lineTo(34, y + 10);
        ctx.lineTo(42, y - 2);
        ctx.stroke();
        // label
        ctx.fillStyle = ticked ? '#228d5c' : '#68778f';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(it, 50, y - 2);
      });

      // three books on the right
      const colors = ['#c43f52', '#228d5c', '#7c3aed'];
      for (let i = 0; i < 3; i++) {
        const x = 130 + i * 36;
        const y = H - 28;
        ctx.fillStyle = colors[i];
        ctx.fillRect(x - 14, y - 18, 28, 36);
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - 14, y - 18, 28, 36);
        if (e > tickAt[i]) {
          ctx.fillStyle = '#fff7d6';
          ctx.fillRect(x - 11, y - 4, 22, 9);
          ctx.fillStyle = '#228d5c';
          ctx.font = 'bold 9px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', x, y);
        }
      }

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

export default AnaChap6;
