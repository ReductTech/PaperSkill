import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: loaded bike climbs slowly, duplicate ghost boxes trail
// behind and a red NMS checkpoint booth trims them one by one.
const W = 480;
const H = 200;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a',
};

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, loaded: boolean) {
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  // wheels
  ctx.beginPath(); ctx.arc(x - 18 * s, y, 14 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 20 * s, y, 14 * s, 0, Math.PI * 2); ctx.stroke();
  // frame
  ctx.beginPath();
  ctx.moveTo(x - 18 * s, y); ctx.lineTo(x - 2 * s, y - 16 * s);
  ctx.lineTo(x + 20 * s, y); ctx.lineTo(x - 18 * s, y);
  ctx.moveTo(x - 2 * s, y - 16 * s); ctx.lineTo(x + 4 * s, y - 20 * s);
  ctx.stroke();
  // rider
  ctx.fillStyle = C.blue;
  ctx.beginPath(); ctx.arc(x + 2 * s, y - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.beginPath(); ctx.moveTo(x + 2 * s, y - 24 * s); ctx.lineTo(x - 2 * s, y - 14 * s); ctx.stroke();
  if (loaded) {
    ctx.fillStyle = C.red;
    ctx.fillRect(x - 34 * s, y - 26 * s, 16 * s, 18 * s);
  }
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3200) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // hill + road
      ctx.fillStyle = C.light; ctx.fillRect(0, 150, W, 50);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 152); ctx.lineTo(W, 128); ctx.stroke();
      // NMS checkpoint booth
      const boothX = 380;
      ctx.fillStyle = C.red; ctx.fillRect(boothX, 96, 54, 40);
      ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
      ctx.fillText('NMS', boothX + 12, 120);
      // rider climbs slowly with wobble
      const px = 40 + t * 300;
      const py = 146 - (px / W) * 20 + Math.sin(t * Math.PI * 8) * 2;
      // duplicate ghost boxes trail
      for (let k = 1; k <= 4; k++) {
        ctx.strokeStyle = 'rgba(196,63,82,0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 26 - k * 14, py - 40, 40, 34);
      }
      drawBike(ctx, px, py - 14, 0.9, true);
      // checkpoint trims ghosts near the booth
      if (px > boothX - 90) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 2;
        ctx.strokeRect(px - 26, py - 40, 40, 34);
      }
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('旧管线', 16, 26);
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

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
