import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, drawFlag, drawClouds, loopX } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: a light bike rides the same road with one clean trail,
// passes a "direct route" signpost and crosses the waving finish flag.
const W = 480;
const H = 200;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a',
};

const roadY = (x: number) => 152 - (x / W) * 24;

export const HeroNew: React.FC<WidgetProps> = () => {
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
      drawClouds(ctx, time, W, 22);
      ctx.fillStyle = C.light; ctx.fillRect(0, 150, W, 50);
      // road
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 152); ctx.lineTo(W, 128); ctx.stroke();
      // direct route signpost
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(120, 150); ctx.lineTo(120, 104); ctx.stroke();
      ctx.fillStyle = C.blue; ctx.fillRect(96, 84, 60, 22);
      ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
      ctx.fillText('直达', 116, 100);
      // finish flag (waves gently; the rider truly crosses it each loop)
      drawFlag(ctx, 430, 96, 54, time, C.green);
      // single clean trail + rider — faster, steady, seamless off-screen loop
      const px = loopX(t, W, 70);
      const axleY = roadY(px) - 13;
      const crossing = px > 400 && px < 500;
      ctx.strokeStyle = crossing ? 'rgba(34,141,92,0.5)' : 'rgba(39,68,110,0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px - 30, axleY + 6); ctx.lineTo(px, axleY + 6); ctx.stroke();
      drawCyclist(ctx, px, axleY, {
        scale: 0.9, color: C.green, riderColor: C.blue,
        wheelPhase: px / 12, pedalPhase: px / 20,
      });
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('YOLO26', 16, 26);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
