import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-4: 244x130 — pen writes character-by-character onto concept card.

const W = 244;
const H = 130;

export const AnaChap4: React.FC<WidgetProps> = () => {
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
      ctx.fillRect(36, 18, 170, 70);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(36, 18, 170, 70);

      // response text scrolls
      const response = '车 / Car / 汽车 / automobile';
      const cursor = Math.floor((e * 6) % (response.length + 1));
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(response.slice(0, cursor), 44, 40);

      // pen follows cursor
      const penX = 44 + ctx.measureText(response.slice(0, cursor)).width + 4;
      const penY = 40 + Math.sin(e * 8) * 2;
      ctx.save();
      ctx.translate(penX, penY);
      ctx.rotate(0.4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-2, -10, 4, 12);
      ctx.fillStyle = '#21324a';
      ctx.fillRect(-2, 2, 4, 4);
      ctx.restore();

      // L_align label
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('L_align 逐字对齐', 44, 72);

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

export default AnaChap4;
