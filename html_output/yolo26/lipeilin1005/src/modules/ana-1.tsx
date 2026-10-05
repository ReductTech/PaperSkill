import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 1: loaded bike labors up a slope toward a summit signpost.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', red: '#c43f52', text: '#21324a',
};

export const Ana1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3200) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      // slope
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(W, 74); ctx.stroke();
      // summit signpost
      ctx.beginPath(); ctx.moveTo(500, 96); ctx.lineTo(500, 46); ctx.stroke();
      ctx.fillStyle = C.blue; ctx.fillRect(474, 30, 56, 20);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('坡顶', 492, 45);
      // rider + heavy pannier, slow wobbling climb
      const px = 30 + t * 440;
      const py = 104 - (px / W) * 30 + Math.sin(t * Math.PI * 10) * 2.5;
      const s = 0.8;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * s, py); ctx.lineTo(px - 2 * s, py - 16 * s);
      ctx.lineTo(px + 20 * s, py); ctx.lineTo(px - 18 * s, py);
      ctx.moveTo(px - 2 * s, py - 16 * s); ctx.lineTo(px + 4 * s, py - 20 * s);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * s, py - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.red; ctx.fillRect(px - 34 * s, py - 26 * s, 18 * s, 20 * s);
      // effort puffs
      ctx.fillStyle = 'rgba(104,119,143,0.5)';
      ctx.beginPath(); ctx.arc(px + 16, py - 42 - Math.sin(t * Math.PI * 10) * 2, 3, 0, Math.PI * 2); ctx.fill();
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id="cv-ana-1" ref={canvasRef} width={W} height={H} />;
};

export default Ana1;
