import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, loopX } from '../lib/canvasKit';
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
      // finish line (checkered)
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
      // rider at constant speed with spinning spokes — seamless off-screen loop
      const px = loopX(t, W, 60);
      const py = 104 - 14; // axle height: wheels rest on the 104 ground line
      drawCyclist(ctx, px, py, {
        scale: 1, color: C.blue,
        wheelPhase: px / 14, pedalPhase: px / 22,
      });
      // flag waves once the rider crosses the line
      const crossed = px > 470;
      const wave = crossed ? Math.sin(time / 90) * 4 : Math.sin(time / 300) * 1.2;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(480, 40);
      ctx.quadraticCurveTo(500, 36 + wave, 520, 42 + wave);
      ctx.lineTo(520, 54 + wave);
      ctx.quadraticCurveTo(500, 50 + wave, 480, 52);
      ctx.fill();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-6" ref={canvasRef} width={W} height={H} />;
};

export default Ana6;
