import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 3: rider follows one clear single track straight to the finish flag.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a',
};

export const Ana3: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      // single blue lane
      ctx.strokeStyle = C.blue; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(520, 100); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(520, 100); ctx.stroke();
      ctx.setLineDash([]);
      // finish flag
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(520, 104); ctx.lineTo(520, 44); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(520, 44); ctx.lineTo(554, 52); ctx.lineTo(520, 60); ctx.fill();
      // rider on the single lane
      const px = 30 + t * 450;
      const s = 0.8;
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * s, 100, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * s, 100, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * s, 100); ctx.lineTo(px - 2 * s, 84);
      ctx.lineTo(px + 20 * s, 100); ctx.lineTo(px - 18 * s, 100);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * s, 74, 6 * s, 0, Math.PI * 2); ctx.fill();
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

  return <canvas id="cv-ana-3" ref={canvasRef} width={W} height={H} />;
};

export default Ana3;
