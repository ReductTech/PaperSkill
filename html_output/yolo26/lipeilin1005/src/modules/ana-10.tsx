import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 10: two riders (blue = YOLO11, green = YOLO26) race on the same track,
// trading the lead in a gentle sway — ambient loop before the real race module.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a', muted: '#68778f',
};

const drawRider = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, color: string, pedal: number
) => {
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(px - 16, py, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px + 18, py, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px - 16, py); ctx.lineTo(px - 2, py - 15); ctx.lineTo(px + 18, py); ctx.lineTo(px - 16, py);
  ctx.moveTo(px - 2, py - 15); ctx.lineTo(px + 3, py - 19);
  ctx.moveTo(px - 2, py - 15); ctx.lineTo(px - 2 + Math.cos(pedal) * 10, py - 15 + Math.sin(pedal) * 10);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(px + 1, py - 28, 6, 0, Math.PI * 2); ctx.fill();
};

export const Ana10: React.FC<WidgetProps> = () => {
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
      // finish line at right
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(508, 52); ctx.lineTo(508, 104); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#fff' : C.text;
        ctx.fillRect(508, 52 + i * 10, 8, 10);
      }
      // both riders cruise, green slightly ahead with a sway
      const sway = Math.sin(t * Math.PI * 2) * 10;
      const xOld = 120 + t * 340;
      const xNew = 132 + t * 340 + sway;
      const pedal = time / 90;
      drawRider(ctx, xOld, 84, C.blue, pedal);
      drawRider(ctx, Math.min(xNew, 486), 84, C.green, pedal * 1.1);
      ctx.fillStyle = C.blue; ctx.font = '11px sans-serif';
      ctx.fillText('YOLO11', xOld - 20, 112);
      ctx.fillStyle = C.green;
      ctx.fillText('YOLO26', Math.min(xNew, 486) - 22, 112);
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

  return <canvas id="cv-ana-10" ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
