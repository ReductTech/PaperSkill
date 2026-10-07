import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, loopX } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 2: rider shifts gears — the chain highlight moves across three cogs.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', text: '#21324a',
};

export const Ana2: React.FC<WidgetProps> = () => {
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
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(W, 96); ctx.stroke();
      // slope sign
      ctx.beginPath(); ctx.moveTo(470, 108); ctx.lineTo(470, 66); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.fillRect(446, 50, 52, 18);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('坡度', 462, 64);
      // bike rolling — seamless off-screen loop
      const px = loopX(t, W, 60);
      const py = 92;
      drawCyclist(ctx, px, py, {
        scale: 0.8, color: C.blue,
        wheelPhase: px / 11, pedalPhase: px / 18,
      });
      // rear cassette: three cogs; the active one eases in with a soft glow
      const gearPos = (t * 3) % 3;
      const gear = Math.floor(gearPos);
      const gearFrac = gearPos - gear;
      for (let g = 0; g < 3; g++) {
        const gx = px - 34 - g * 10;
        const w = g === gear ? Math.min(1, gearFrac * 4) : g === (gear + 2) % 3 ? Math.max(0, 1 - gearFrac * 4) : 0;
        if (w > 0.02) {
          ctx.strokeStyle = `rgba(34,141,92,${0.25 + 0.55 * w})`;
          ctx.lineWidth = 2 + 2 * w;
        } else {
          ctx.strokeStyle = C.route;
          ctx.lineWidth = 2;
        }
        ctx.beginPath(); ctx.arc(gx, py, 6 + g * 3, 0, Math.PI * 2); ctx.stroke();
      }
      // chain line to active cog
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - 14.4, py - 8); ctx.lineTo(px - 34 - gear * 10, py - 4); ctx.stroke();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-2" ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
