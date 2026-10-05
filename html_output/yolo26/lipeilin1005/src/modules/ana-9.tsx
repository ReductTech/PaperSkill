import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 9: wrench tightens the smallest screw on the frame — it goes from loose
// (red) to tight (green) with a check mark. The tiniest part decides safety.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana9: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      const tight = Math.min(t / 0.7, 1); // 0 loose -> 1 tight by 70% of loop
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 112, W, 28);
      // bike frame (simplified)
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 104); ctx.lineTo(210, 50); ctx.lineTo(340, 104); ctx.lineTo(140, 104);
      ctx.moveTo(210, 50); ctx.lineTo(300, 50);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(140, 104, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(340, 104, 26, 0, Math.PI * 2); ctx.stroke();
      // the tiny screw at the frame joint
      const sx = 210; const sy = 50;
      const screwColor = lerpColor(C.red, C.green, tight);
      ctx.fillStyle = screwColor;
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      const slotA = tight >= 1 ? 0 : (time / 160) % (Math.PI * 2);
      ctx.beginPath(); ctx.moveTo(sx - 4 * Math.cos(slotA), sy - 4 * Math.sin(slotA)); ctx.lineTo(sx + 4 * Math.cos(slotA), sy + 4 * Math.sin(slotA)); ctx.stroke();
      // wrench oscillating over the screw, retreats when done
      const reach = tight >= 1 ? Math.max(0, 1 - (t - 0.7) / 0.1) : 1;
      const wig = Math.sin(time / 110) * 0.25 * (1 - tight);
      const wAng = -Math.PI / 3 + wig;
      const wx = sx + 34 * Math.cos(wAng) * reach;
      const wy = sy + 34 * Math.sin(wAng) * reach;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 56 * Math.cos(wAng), wy + 56 * Math.sin(wAng)); ctx.stroke();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, 10, 0, Math.PI * 2); ctx.stroke();
      // check mark when tight
      if (tight >= 1) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(sx - 14, sy - 18); ctx.lineTo(sx - 8, sy - 10); ctx.lineTo(sx + 4, sy - 24); ctx.stroke();
      } else {
        ctx.fillStyle = C.red; ctx.font = '11px sans-serif';
        ctx.fillText('松', sx + 12, sy + 4);
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

  return <canvas id="cv-ana-9" ref={canvasRef} width={W} height={H} />;
};

export default Ana9;
