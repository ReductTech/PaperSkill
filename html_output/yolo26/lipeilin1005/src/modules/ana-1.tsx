import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, loopX } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 1: loaded bike labors up a slope toward a summit signpost.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', red: '#c43f52', text: '#21324a',
};

const roadY = (x: number) => 106 - (x / W) * 32;

export const Ana1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3400) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      // slope
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(W, 74); ctx.stroke();
      // summit signpost
      ctx.beginPath(); ctx.moveTo(500, 96); ctx.lineTo(500, 46); ctx.stroke();
      ctx.fillStyle = C.blue; ctx.fillRect(474, 30, 56, 20);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('坡顶', 492, 45);
      // rider + heavy pannier, slow wobbling climb — seamless off-screen loop
      const px = loopX(t, W, 60);
      const wobble = Math.sin(t * Math.PI * 10) * 2.5;
      const axleY = roadY(px) - 11 + wobble;
      drawCyclist(ctx, px, axleY, {
        scale: 0.8, color: C.blue, loaded: true, loadColor: C.red, loadSize: 18,
        wheelPhase: px / 11, pedalPhase: px / 18,
      });
      // effort puffs rising above the rider
      ctx.fillStyle = 'rgba(104,119,143,0.5)';
      for (let i = 0; i < 3; i++) {
        const pt = (t * 3 + i / 3) % 1;
        ctx.globalAlpha = 0.5 * (1 - pt);
        ctx.beginPath();
        ctx.arc(px + 16 + pt * 6, axleY - 32 - pt * 14, 2 + pt * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-1" ref={canvasRef} width={W} height={H} />;
};

export default Ana1;
