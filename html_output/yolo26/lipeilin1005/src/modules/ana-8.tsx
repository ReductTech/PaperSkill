import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 8: turn the crank and the whole drivetrain cooperates — chain runs and
// the rear wheel spins; a wrench rests nearby (the whole bike, not one part).
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana8: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const rot = time / 300;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 112, W, 28);
      // frame
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 100); ctx.lineTo(200, 44); ctx.lineTo(330, 100); ctx.lineTo(140, 100);
      ctx.moveTo(200, 44); ctx.lineTo(290, 44);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(330, 100); ctx.lineTo(370, 40); ctx.stroke();
      // crank + chainring
      const cx = 200; const cy = 100;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.green; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(rot) * 26, cy + Math.sin(rot) * 26); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillRect(cx + Math.cos(rot) * 26 - 8, cy + Math.sin(rot) * 26 - 4, 16, 8);
      // rear wheel + sprocket
      const wx = 330; const wy = 100; const wr = 34;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = rot * 1.6 + (i * Math.PI * 2) / 5;
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.stroke();
      // chain (two runs)
      ctx.strokeStyle = C.route; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx + 18, cy - 6); ctx.lineTo(wx - 8, wy - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 18, cy + 6); ctx.lineTo(wx - 8, wy + 6); ctx.stroke();
      // wrench resting
      ctx.strokeStyle = C.muted; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(440, 120); ctx.lineTo(490, 70); ctx.stroke();
      ctx.beginPath(); ctx.arc(440, 122, 10, 0, Math.PI * 2); ctx.stroke();
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

  return <canvas id="cv-ana-8" ref={canvasRef} width={W} height={H} />;
};

export default Ana8;
