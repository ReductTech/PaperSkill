import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero side: BabelRS — a tutor writes one concept card; all three books get
// the same label. Continuous ambient loop.

const W = 360;
const H = 200;

export const HeroBabelRs: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawBook = (x: number, y: number, color: string, label: string, frame: number) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 38, y - 28, 76, 56);
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 38, y - 28, 76, 56);
      // label band on cover
      ctx.fillStyle = '#fff7d6';
      const w = 50 + (frame % 30);
      ctx.fillRect(x - w / 2, y - 8, w, 16);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('车 / Car', x, y);
    };

    const render = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 60, W, 60);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30);
      ctx.stroke();

      // concept card on the desk
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(40, H - 110, 120, 60);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(40, H - 110, 120, 60);
      // big character "车"
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 40px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('车', 100, H - 80);
      // small subtitle
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('共享概念 / Car', 100, H - 50);

      // three books on the desk with the same label
      const t01 = (elapsed * 0.6) % 1;
      drawBook(220, H - 60, '#c43f52', 'RGB', t01 * 30);
      drawBook(290, H - 60, '#228d5c', 'SAR', (t01 + 0.33) * 30);
      drawBook(220, H - 50 + Math.sin(elapsed) * 2, '#7c3aed', 'IR', (t01 + 0.66) * 30);

      // tutor's steady pen pointing to the concept card
      const px = 180 + Math.sin(elapsed * 1.3) * 3;
      const py = H - 70 + Math.cos(elapsed * 1.3) * 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.3);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-3, -22, 6, 26);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(-3, 4, 6, 6);
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

  return <canvas ref={canvasRef} width={W} height={H} aria-label="BabelRS 示意图" />;
};

export default HeroBabelRs;
