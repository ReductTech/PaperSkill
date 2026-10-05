import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 6: rider cruises at a steady pace and rolls over the finish line;
// the flag waves as the wheel spins — one uninterrupted end-to-end ride.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a', muted: '#68778f',
};

export const Ana6: React.FC<WidgetProps> = () => {
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
      // finish line
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(480, 56); ctx.lineTo(480, 104); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#fff' : C.text;
        ctx.fillRect(480, 56 + i * 10, 8, 10);
      }
      // tree
      ctx.fillStyle = C.route; ctx.fillRect(210, 82, 6, 24);
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(213, 72, 18, 0, Math.PI * 2); ctx.fill();
      // rider at constant speed, wheel rotating
      const px = -40 + t * 560;
      const py = 104;
      const rot = px / 11;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      for (const wx of [px - 18, px + 20]) {
        ctx.beginPath(); ctx.arc(wx, py, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx, py); ctx.lineTo(wx + Math.cos(rot) * 12, py + Math.sin(rot) * 12);
        ctx.moveTo(wx, py); ctx.lineTo(wx + Math.cos(rot + Math.PI) * 12, py + Math.sin(rot + Math.PI) * 12);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(px - 18, py); ctx.lineTo(px - 2, py - 16); ctx.lineTo(px + 20, py); ctx.lineTo(px - 18, py);
      ctx.moveTo(px - 2, py - 16); ctx.lineTo(px + 4, py - 20);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2, py - 30, 6, 0, Math.PI * 2); ctx.fill();
      // flag waves when crossed
      if (px > 470) {
        const wave = Math.sin(time / 90) * 4;
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.moveTo(480, 40); ctx.quadraticCurveTo(500, 36 + wave, 520, 42 + wave); ctx.lineTo(520, 54 + wave); ctx.quadraticCurveTo(500, 50 + wave, 480, 52); ctx.fill();
      } else {
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.moveTo(480, 40); ctx.lineTo(516, 46); ctx.lineTo(480, 52); ctx.fill();
      }
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

  return <canvas id="cv-ana-6" ref={canvasRef} width={W} height={H} />;
};

export default Ana6;
