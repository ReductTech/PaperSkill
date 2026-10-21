import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop } from '../lib/canvasKit';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const rot = time / 300;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // whole bike rests ON the ground band (top y=112): wheel axles at y=78
      ctx.fillStyle = C.light; ctx.fillRect(0, 112, W, 28);
      const axleY = 78; const wr = 34;
      // frame
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, axleY); ctx.lineTo(205, 34); ctx.lineTo(330, axleY); ctx.lineTo(140, axleY);
      ctx.moveTo(205, 34); ctx.lineTo(292, 34);
      ctx.stroke();
      // seat post + saddle
      ctx.beginPath(); ctx.moveTo(330, axleY); ctx.lineTo(352, 44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(343, 44); ctx.lineTo(361, 44); ctx.stroke();
      // crank + chainring (pedal never dips into the ground)
      const cx = 205; const cy = 88;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.green; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(rot) * 18, cy + Math.sin(rot) * 18); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillRect(cx + Math.cos(rot) * 18 - 8, cy + Math.sin(rot) * 18 - 4, 16, 8);
      // both wheels spin with the drivetrain
      for (const wx of [140, 330]) {
        ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(wx, axleY, wr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          const a = rot * 1.6 + (i * Math.PI * 2) / 5;
          ctx.beginPath(); ctx.moveTo(wx, axleY); ctx.lineTo(wx + Math.cos(a) * wr, axleY + Math.sin(a) * wr); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(wx, axleY, wx === 330 ? 9 : 5, 0, Math.PI * 2); ctx.stroke();
      }
      // chain (two runs) — links march along with the drivetrain
      ctx.strokeStyle = C.route; ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -(time / 24) % 12;
      ctx.beginPath(); ctx.moveTo(cx + 16, cy - 5); ctx.lineTo(322, axleY - 4); ctx.stroke();
      ctx.lineDashOffset = ((time / 24) % 12);
      ctx.beginPath(); ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(322, axleY + 6); ctx.stroke();
      ctx.setLineDash([]);
      // combination wrench resting on the ground — open jaw up, ring grip down
      ctx.strokeStyle = C.muted; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(446, 96); ctx.lineTo(484, 62); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(490, 56, 9, Math.PI * 0.15, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(440, 103, 9, 0, Math.PI * 2); ctx.stroke();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-8" ref={canvasRef} width={W} height={H} />;
};

export default Ana8;
