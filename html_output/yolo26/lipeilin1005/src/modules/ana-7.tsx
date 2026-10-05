import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 7: rider follows a training schedule board — the fill bar climbs while
// the road tilts steeper, and the rider finishes through the flag.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a', muted: '#68778f',
};

export const Ana7: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3400) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // slope rises with progress
      const slopeH = lerp(4, 56, t);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 108); ctx.lineTo(W, 108 - slopeH); ctx.stroke();
      // schedule board (static, left)
      ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(70, 108); ctx.lineTo(70, 34); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(38, 22, 96, 44);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(38, 22, 96, 44);
      ctx.fillStyle = C.green; ctx.fillRect(44, 50 - 20 * t, 84, 4 + 20 * t);
      ctx.strokeStyle = C.muted; ctx.strokeRect(44, 30, 84, 24);
      // rider progresses along the slope
      const px = 90 + t * 400;
      const py = 108 - (px / W) * slopeH + Math.sin(t * Math.PI * 14) * 1.5;
      const s = 0.8;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * s, py); ctx.lineTo(px - 2 * s, py - 16 * s); ctx.lineTo(px + 20 * s, py); ctx.lineTo(px - 18 * s, py);
      ctx.moveTo(px - 2 * s, py - 16 * s); ctx.lineTo(px + 4 * s, py - 20 * s);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * s, py - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      // finish flag at right
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(508, 52 - slopeH + 20); ctx.lineTo(508, 108 - (508 / W) * slopeH); ctx.stroke();
      const wave = t > 0.92 ? Math.sin(time / 80) * 3 : 0;
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(508, 52 - slopeH + 20); ctx.lineTo(532, 56 - slopeH + 20 + wave); ctx.lineTo(508, 62 - slopeH + 20); ctx.fill();
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

  return <canvas id="cv-ana-7" ref={canvasRef} width={W} height={H} />;
};

export default Ana7;
