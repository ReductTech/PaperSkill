import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, drawClouds, loopX } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: loaded bike climbs slowly, duplicate ghost boxes trail
// behind and a red NMS checkpoint booth trims them one by one.
const W = 480;
const H = 200;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a',
};

const roadY = (x: number) => 152 - (x / W) * 24;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      drawClouds(ctx, time, W, 22);
      // hill + road
      ctx.fillStyle = C.light; ctx.fillRect(0, 150, W, 50);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 152); ctx.lineTo(W, 128); ctx.stroke();
      // sparse grass tufts rooted in the green shoulder, clear of the road line
      ctx.strokeStyle = C.dark; ctx.lineWidth = 1.5;
      for (const gx of [60, 170, 300, 440]) {
        const gy = 168 + (gx % 3) * 5;
        for (const dx of [-4, 0, 4]) {
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.quadraticCurveTo(gx + dx * 0.5, gy - 5, gx + dx, gy - 9);
          ctx.stroke();
        }
      }
      // NMS checkpoint booth
      const boothX = 380;
      ctx.fillStyle = C.red; ctx.fillRect(boothX, 96, 54, 40);
      ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
      ctx.fillText('NMS', boothX + 12, 120);
      // rider climbs slowly with wobble — enters/exits off-screen for a seamless loop
      const px = loopX(t, W, 70);
      const wobble = Math.sin(t * Math.PI * 8) * 2;
      const axleY = roadY(px) - 13 + wobble;
      // duplicate ghost boxes trail behind, fading with distance
      for (let k = 4; k >= 1; k--) {
        ctx.strokeStyle = `rgba(196,63,82,${0.4 - k * 0.07})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 26 - k * 14, axleY - 26, 40, 34);
      }
      drawCyclist(ctx, px, axleY, {
        scale: 0.9, color: C.blue, loaded: true, loadColor: C.red,
        wheelPhase: px / 12, pedalPhase: px / 20,
      });
      // checkpoint trims ghosts near the booth: one clean survivor
      if (px > boothX - 90 && px < boothX + 60) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 2;
        ctx.strokeRect(px - 26, axleY - 26, 40, 34);
      }
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('旧管线', 16, 26);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
