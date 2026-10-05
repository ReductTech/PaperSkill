import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 5: rider waits at a fork while two routes (direct greenway vs scenic road)
// alternate their glow; both lead to the same flag.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana5: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      const phase = Math.sin(t * Math.PI * 2) > 0 ? 0 : 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      // fork point
      const fx = 120; const fy = 104;
      // upper route: direct greenway (blue)
      ctx.strokeStyle = phase === 0 ? C.blue : 'rgba(39,68,110,0.35)';
      ctx.lineWidth = phase === 0 ? 6 : 3;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(300, 60, 500, 72); ctx.stroke();
      // lower route: scenic road (green) with a red checkpoint booth
      ctx.strokeStyle = phase === 1 ? C.green : 'rgba(34,141,92,0.35)';
      ctx.lineWidth = phase === 1 ? 6 : 3;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(300, 140, 500, 100); ctx.stroke();
      ctx.fillStyle = C.red; ctx.fillRect(330, 96, 22, 22);
      ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.fillText('检', 337, 111);
      // shared finish flag
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(505, 40); ctx.lineTo(505, 108); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(505, 40); ctx.lineTo(530, 48); ctx.lineTo(505, 56); ctx.fill();
      // signpost at the fork
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, 66); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.fillRect(fx - 20, 50, 40, 16);
      // waiting rider
      const bob = Math.sin(time / 300) * 1.5;
      const px = 70; const py = 104 + bob;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 14, py, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 16, py, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 14, py); ctx.lineTo(px - 1, py - 13); ctx.lineTo(px + 16, py); ctx.lineTo(px - 14, py);
      ctx.moveTo(px - 1, py - 13); ctx.lineTo(px + 4, py - 17);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2, py - 24, 5.5, 0, Math.PI * 2); ctx.fill();
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

  return <canvas id="cv-ana-5" ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
