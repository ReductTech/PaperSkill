import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 4: analog 16-tick gauge needle jitters at the end of its range while a
// digital odometer keeps counting — DFL bins vs direct regression.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana4: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 116, W, 24);
      // analog gauge (left)
      const gx = 150; const gy = 96; const r = 56;
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, 0); ctx.stroke();
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI + (i / 16) * Math.PI;
        ctx.strokeStyle = i === 16 ? C.red : C.muted;
        ctx.lineWidth = i % 4 === 0 ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(a) * (r - 4), gy + Math.sin(a) * (r - 4));
        ctx.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
        ctx.stroke();
      }
      // needle sweeps with easing and jitters once pegged at the end
      const frac = easeInOutQuad(Math.min(t / 0.85, 1));
      const pegged = t > 0.85;
      const jitter = pegged ? Math.sin(time / 40) * 0.02 : 0;
      const a = Math.PI + (frac + jitter) * Math.PI;
      ctx.strokeStyle = pegged ? C.red : C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * (r - 10), gy + Math.sin(a) * (r - 10)); ctx.stroke();
      // red glow while pegged
      if (pegged) {
        ctx.fillStyle = `rgba(196,63,82,${0.12 + 0.06 * Math.sin(time / 90)})`;
        ctx.beginPath(); ctx.arc(gx, gy, r + 6, Math.PI, 0); ctx.fill();
      }
      ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
      ctx.fillText('DFL·16格', gx - 26, gy + 18);
      // digital odometer (right)
      const ox = 400;
      ctx.fillStyle = C.green; ctx.fillRect(ox - 70, 52, 140, 40);
      const digits = Math.floor(t * 9999).toString().padStart(4, '0');
      ctx.fillStyle = '#fff'; ctx.font = '24px monospace';
      ctx.fillText(digits, ox - 36, 80);
      ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
      ctx.fillText('直接回归·直显', ox - 40, gy + 18);
      // rider silhouette center
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(280, 60, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(280, 68); ctx.lineTo(280, 96); ctx.stroke();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-4" ref={canvasRef} width={W} height={H} />;
};

export default Ana4;
