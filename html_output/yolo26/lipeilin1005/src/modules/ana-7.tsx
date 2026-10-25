import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, drawFlag, loopX, lerp, easeInOutQuad } from '../lib/canvasKit';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3600) % 1;
      // ride phase 0→0.82: slope steepens; return phase: slope eases back to flat
      // so the loop wrap is invisible both for the rider and the road.
      const rideT = t < 0.82 ? t / 0.82 : 1;
      const settle = t < 0.82 ? 0 : easeInOutQuad((t - 0.82) / 0.18);
      const prog = rideT * (1 - settle);
      const slopeH = lerp(4, 56, prog);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 108); ctx.lineTo(W, 108 - slopeH); ctx.stroke();
      // schedule board (left)
      ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(70, 108); ctx.lineTo(70, 34); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(38, 22, 96, 44);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(38, 22, 96, 44);
      ctx.fillStyle = C.green; ctx.fillRect(44, 50 - 20 * prog, 84, 4 + 20 * prog);
      ctx.strokeStyle = C.muted; ctx.strokeRect(44, 30, 84, 24);
      // rider progresses along the slope — seamless off-screen loop
      const px = loopX(t, W, 60);
      const axleY = 108 - (px / W) * slopeH - 11 + Math.sin(t * Math.PI * 14) * 1.5;
      drawCyclist(ctx, px, axleY, {
        scale: 0.8, color: C.blue,
        wheelPhase: px / 11, pedalPhase: px / 18,
      });
      // finish flag on the hilltop, waves harder as the rider approaches
      const flagBaseY = 108 - (508 / W) * slopeH;
      const near = Math.max(0, 1 - Math.abs(px - 508) / 160);
      drawFlag(ctx, 508, flagBaseY - 56, 56, time * (1 + near * 2), C.green);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-7" ref={canvasRef} width={W} height={H} />;
};

export default Ana7;
