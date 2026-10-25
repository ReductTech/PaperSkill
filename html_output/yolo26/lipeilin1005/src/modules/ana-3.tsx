import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, drawFlag, loopX } from '../lib/canvasKit';
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
      // single blue lane with dashes drifting backwards (motion cue)
      ctx.strokeStyle = C.blue; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(520, 100); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -(time / 18) % 20;
      ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(520, 100); ctx.stroke();
      ctx.setLineDash([]);
      // finish flag — waving; the rider truly crosses it before looping
      drawFlag(ctx, 520, 44, 60, time, C.green);
      // rider on the single lane — seamless off-screen loop
      const px = loopX(t, W, 60);
      drawCyclist(ctx, px, 100, {
        scale: 0.8, color: C.green, riderColor: C.blue,
        wheelPhase: px / 11, pedalPhase: px / 18,
      });
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-3" ref={canvasRef} width={W} height={H} />;
};

export default Ana3;
