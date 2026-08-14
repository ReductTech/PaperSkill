import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-1: 244x130 — Tutor's pen bounces between three books; red ink blot.

const W = 244;
const H = 130;

export const AnaChap1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawBook = (x: number, y: number, color: string, label: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 24, y - 18, 48, 36);
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 24, y - 18, 48, 36);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    };

    const render = (t: number) => {
      const e = (t - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 32, W, 32);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, H - 16); ctx.lineTo(W, H - 16);
      ctx.stroke();

      drawBook(60, H - 30, '#c43f52', 'RGB');
      drawBook(120, H - 30, '#228d5c', 'SAR');
      drawBook(180, H - 30, '#7c3aed', 'IR');

      // chaotic pen
      const px = 60 + 60 * ((e * 1.7) % 1) + Math.sin(e * 11) * 8;
      const py = 24 + Math.sin(e * 9) * 10;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(e * 7) * 0.5);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-2, -14, 4, 18);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(-2, 4, 4, 4);
      ctx.restore();

      // red blot
      ctx.fillStyle = 'rgba(196, 63, 82, 0.7)';
      ctx.beginPath();
      ctx.arc(px, py + 8, 4 + Math.sin(e * 4) * 1.5, 0, Math.PI * 2);
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

export default AnaChap1;
