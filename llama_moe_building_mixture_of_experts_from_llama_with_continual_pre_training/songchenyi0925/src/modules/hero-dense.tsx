import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 190;

export const HeroDense: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 158); ctx.lineTo(W - 24, 158); ctx.stroke();
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(54, 96, 14, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) {
        const x = 130 + i * 34;
        ctx.fillStyle = '#dfe7ea'; ctx.fillRect(x, 62, 20, 72);
        ctx.strokeStyle = '#27446e'; ctx.lineWidth = 2; ctx.strokeRect(x, 62, 20, 72);
        ctx.strokeStyle = '#27446e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(68, 96); ctx.lineTo(x, 96); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 20, 96); ctx.lineTo(455, 96); ctx.stroke();
      }
      ctx.fillStyle = '#228d5c'; ctx.beginPath(); ctx.arc(468, 96, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('7B', 244, 34); ctx.fillText('全激活', 224, 54);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, []);
  return <canvas ref={ref} className="hero-canvas" />;
};
export default HeroDense;
