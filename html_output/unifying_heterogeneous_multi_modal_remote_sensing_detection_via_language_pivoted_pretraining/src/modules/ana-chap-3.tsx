import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-3: 244x130 — tutor writes concept card; same label appears on all books.

const W = 244;
const H = 130;

export const AnaChap3: React.FC<WidgetProps> = () => {
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

      // concept card
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(28, 20, 70, 50);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(28, 20, 70, 50);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('车', 63, 45);

      // three books with same label
      const labelX = 130;
      const labels = ['RGB', 'SAR', 'IR'];
      const colors = ['#c43f52', '#228d5c', '#7c3aed'];
      const reveal = Math.min(1, e / 2);
      labels.forEach((lab, i) => {
        const x = 130 + i * 32;
        const y = H - 28;
        ctx.fillStyle = colors[i];
        ctx.fillRect(x - 14, y - 18, 28, 36);
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - 14, y - 18, 28, 36);
        if (reveal > i / 3) {
          ctx.fillStyle = '#fff7d6';
          ctx.fillRect(x - 11, y - 4, 22, 9);
          ctx.fillStyle = '#21324a';
          ctx.font = 'bold 7px "Segoe UI", sans-serif';
          ctx.fillText('车', x, y);
        }
      });

      // tutor pen writing the big character
      const wx = 63 + Math.sin(e * 1.5) * 4;
      const wy = 45 + Math.cos(e * 1.5) * 4;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(0.5);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-2, -12, 4, 14);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(-2, 2, 4, 4);
      ctx.restore();

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

export default AnaChap3;
