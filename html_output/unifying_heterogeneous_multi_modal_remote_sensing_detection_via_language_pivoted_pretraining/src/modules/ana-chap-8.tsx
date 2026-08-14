import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-8: 244x130 — desk → projector → Chinese card flow.

const W = 244;
const H = 130;

export const AnaChap8: React.FC<WidgetProps> = () => {
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
      ctx.fillRect(0, H - 30, W, 30);

      // left: three books
      const colors = ['#c43f52', '#228d5c', '#7c3aed'];
      colors.forEach((c, i) => {
        const x = 28 + i * 14;
        const y = H - 30;
        ctx.fillStyle = c;
        ctx.fillRect(x - 10, y - 18, 18, 28);
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - 10, y - 18, 18, 28);
      });

      // arrow
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(78, 50);
      ctx.lineTo(118, 50);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.moveTo(118, 50);
      ctx.lineTo(112, 46);
      ctx.lineTo(112, 54);
      ctx.closePath();
      ctx.fill();

      // middle: projector box
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(120, 30, 38, 40);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(120, 30, 38, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 139, 50);

      // arrow 2
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(160, 50);
      ctx.lineTo(190, 50);
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.moveTo(190, 50);
      ctx.lineTo(184, 46);
      ctx.lineTo(184, 54);
      ctx.closePath();
      ctx.fill();

      // right: Chinese output card
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(192, 30, 42, 40);
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(192, 30, 42, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('车', 213, 50);

      // moving light pulse
      const lp = (e * 0.7) % 1;
      const lx = 78 + 112 * lp;
      ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.beginPath();
      ctx.arc(lx, 50, 4, 0, Math.PI * 2);
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

export default AnaChap8;
