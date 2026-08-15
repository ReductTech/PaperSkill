import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana-chap-7: 244x130 — full pipeline: open books → write card → tick report cards.

const W = 244;
const H = 130;

export const AnaChap7: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      const e = (t - startRef.current) / 1000;
      const phase = (e * 0.4) % 4; // 0..4 across 10s
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 28, W, 28);

      // 4 step circles in a row
      const labels = ['数据', 'CSIA', 'LVSA', '微调'];
      const colors = ['#27446e', '#228d5c', '#d97706', '#7c3aed'];
      const stepW = (W - 30) / 4;
      for (let i = 0; i < 4; i++) {
        const cx = 22 + i * stepW + stepW / 2;
        const cy = 50;
        const active = phase >= i;
        ctx.fillStyle = active ? colors[i] : '#f5f8f0';
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#fff' : '#21324a';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy);

        ctx.fillStyle = '#21324a';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(labels[i], cx, 75);

        if (i < 3) {
          ctx.strokeStyle = phase > i ? '#228d5c' : '#d7deea';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx + 14, cy);
          ctx.lineTo(cx + stepW - 14, cy);
          ctx.stroke();
        }
      }

      // arrow at the active step
      if (phase < 4) {
        const i = Math.floor(phase);
        const cx = 22 + i * stepW + stepW / 2;
        const cy = 32;
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx - 5, cy);
        ctx.lineTo(cx + 5, cy);
        ctx.closePath();
        ctx.fill();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => {
      startRef.current = performance.now();
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default AnaChap7;
