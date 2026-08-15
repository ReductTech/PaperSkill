import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-5: 244x130 — concept card grows detail strokes over time (annealing).

const W = 244;
const H = 130;

export const AnaChap5: React.FC<WidgetProps> = () => {
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

      // card
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(40, 18, 160, 70);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(40, 18, 160, 70);

      // big character always present
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 32px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('车', 78, 53);

      // detail strokes appear over time
      const detailLevel = (e % 6) / 6; // 0..1
      const detailCount = Math.floor(detailLevel * 8);
      const details = ['边', '线', '面', '色', '纹', '反', '距', '框'];
      ctx.font = '12px "Segoe UI", sans-serif';
      for (let i = 0; i < detailCount; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        ctx.fillStyle = '#7c3aed';
        ctx.fillText(details[i], 100 + col * 22, 35 + row * 18);
      }

      // α(t) mini-curve in lower right
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(160, 82);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const ax = 160 + 36 * t;
        const ay = 82 - 24 * Math.min(1, t * 6 / detailLevel);
        ctx.lineTo(ax, ay);
      }
      ctx.stroke();

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

export default AnaChap5;
