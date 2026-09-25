import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 190;

export const HeroSparse: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 158); ctx.lineTo(W - 24, 158); ctx.stroke();
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(48, 96, 13, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(122, 96); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#d97706'; ctx.fillRect(-24, -24, 48, 48); ctx.restore();
      const selected = [1, 6, 9, 14];
      for (let i = 0; i < 16; i++) {
        const x = 210 + (i % 8) * 26; const y = 62 + Math.floor(i / 8) * 38; const active = selected.includes(i);
        ctx.fillStyle = active ? '#228d5c' : '#dfe7ea'; ctx.fillRect(x, y, 20, 26); ctx.strokeStyle = active ? '#228d5c' : '#d7deea'; ctx.lineWidth = active ? 3 : 1; ctx.strokeRect(x, y, 20, 26);
        if (active) { ctx.strokeStyle = '#228d5c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(146, 96); ctx.quadraticCurveTo(180, y + 13, x, y + 13); ctx.stroke(); }
      }
      ctx.strokeStyle = '#228d5c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(420, 96); ctx.lineTo(448, 96); ctx.stroke();
      ctx.fillStyle = '#228d5c'; ctx.beginPath(); ctx.arc(462, 96, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('4/16', 268, 32); ctx.fillText('N/k', 452, 62);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, []);
  return <canvas ref={ref} className="hero-canvas" />;
};
export default HeroSparse;
