import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, loopX } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 10: two riders (blue = YOLO11, green = YOLO26) race on the same track,
// trading the lead in a gentle sway — ambient loop before the real race module.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a', muted: '#68778f',
};

export const Ana10: React.FC<WidgetProps> = () => {
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
      // finish line at right (checkered)
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(508, 52); ctx.lineTo(508, 104); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#fff' : C.text;
        ctx.fillRect(508, 52 + i * 10, 8, 10);
      }
      // pursuit: YOLO26 leads by a steady gap, YOLO11 chases — the two never
      // overlap, so both riders and their labels stay readable all loop long
      const xNew = loopX(t, W, 80);
      const xOld = xNew - 92 + Math.sin(t * Math.PI * 2) * 6;
      drawCyclist(ctx, xOld, 84, { scale: 0.85, color: C.blue, wheelPhase: xOld / 12, pedalPhase: xOld / 20 });
      drawCyclist(ctx, xNew, 84, { scale: 0.85, color: C.green, wheelPhase: xNew / 12, pedalPhase: xNew / 18 });
      ctx.fillStyle = C.blue; ctx.font = '11px sans-serif';
      if (xOld > 34 && xOld < W - 44) ctx.fillText('YOLO11', xOld - 20, 118);
      ctx.fillStyle = C.green;
      if (xNew > 34 && xNew < W - 44) ctx.fillText('YOLO26', xNew - 22, 118);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-10" ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
