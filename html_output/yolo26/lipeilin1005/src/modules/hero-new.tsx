import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: a light bike rides the same road with one clean trail,
// passes a "direct route" signpost and crosses the finish flag earlier.
const W = 480;
const H = 200;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a',
};

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x - 18 * s, y, 14 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 20 * s, y, 14 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 18 * s, y); ctx.lineTo(x - 2 * s, y - 16 * s);
  ctx.lineTo(x + 20 * s, y); ctx.lineTo(x - 18 * s, y);
  ctx.moveTo(x - 2 * s, y - 16 * s); ctx.lineTo(x + 4 * s, y - 20 * s);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath(); ctx.arc(x + 2 * s, y - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.beginPath(); ctx.moveTo(x + 2 * s, y - 24 * s); ctx.lineTo(x - 2 * s, y - 14 * s); ctx.stroke();
}

export const HeroNew: React.FC<WidgetProps> = () => {
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
      ctx.fillStyle = C.light; ctx.fillRect(0, 150, W, 50);
      // direct route signpost
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(120, 150); ctx.lineTo(120, 104); ctx.stroke();
      ctx.fillStyle = C.blue; ctx.fillRect(96, 84, 60, 22);
      ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
      ctx.fillText('直达', 116, 100);
      // finish flag
      ctx.strokeStyle = C.route;
      ctx.beginPath(); ctx.moveTo(430, 150); ctx.lineTo(430, 96); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(430, 96); ctx.lineTo(462, 104); ctx.lineTo(430, 112); ctx.fill();
      // road
      ctx.strokeStyle = C.route;
      ctx.beginPath(); ctx.moveTo(0, 152); ctx.lineTo(W, 128); ctx.stroke();
      // single clean trail + rider (faster, steady)
      const px = 30 + t * 380;
      const py = 148 - (px / W) * 20;
      ctx.strokeStyle = 'rgba(39,68,110,0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px - 30, py - 8); ctx.lineTo(px, py - 8); ctx.stroke();
      drawBike(ctx, px, py - 14, 0.9);
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('YOLO26', 16, 26);
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

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
