import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 2: rider shifts gears — the chain highlight moves across three cogs.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', text: '#21324a',
};

export const Ana2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(W, 96); ctx.stroke();
      // slope sign
      ctx.beginPath(); ctx.moveTo(470, 108); ctx.lineTo(470, 66); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.fillRect(446, 50, 52, 18);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('坡度', 462, 64);
      // bike rolling
      const px = 40 + t * 430;
      const py = 92;
      const s = 0.8;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * s, py); ctx.lineTo(px - 2 * s, py - 16 * s);
      ctx.lineTo(px + 20 * s, py); ctx.lineTo(px - 18 * s, py);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * s, py - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      // rear cassette: three cogs, highlight cycles
      const gear = Math.floor(t * 3) % 3;
      for (let g = 0; g < 3; g++) {
        const gx = px - 34 - g * 10;
        ctx.strokeStyle = g === gear ? C.green : C.route;
        ctx.lineWidth = g === gear ? 4 : 2;
        ctx.beginPath(); ctx.arc(gx, py, 6 + g * 3, 0, Math.PI * 2); ctx.stroke();
      }
      // chain line to active cog
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - 18 * s, py - 8); ctx.lineTo(px - 34 - gear * 10, py - 4); ctx.stroke();
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

  return <canvas id="cv-ana-2" ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
