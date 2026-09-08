import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 244;
const H = 130;
const CX = 122;
const CY = 66;

export const SummaryAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const colors = [C.blue, C.orange, C.green, C.purple, C.route, C.red];
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const cyc = t % 6.0;
      // six pieces assemble into a hexagon map
      for (let i = 0; i < 6; i += 1) {
        const local = Math.max(0, Math.min(1, (cyc - i * 0.16) / 0.8));
        const start = 0.35 + 0.65 * local;
        const ang = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const tx = CX + Math.cos(ang) * 32;
        const ty = CY + Math.sin(ang) * 26;
        const sx = CX + Math.cos(ang) * 88;
        const sy = CY + Math.sin(ang) * 52;
        const x = sx + (tx - sx) * start;
        const y = sy + (ty - sy) * start;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(local * 0.8);
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = 0.55 + 0.45 * start;
        ctx.beginPath();
        // puzzle-like hex piece
        for (let k = 0; k < 6; k += 1) {
          const a = (k / 6) * Math.PI * 2;
          const r = 13;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      // assembled ring pulse + check
      const hold = Math.max(0, Math.min(1, (cyc - 1.8) / 1.2));
      if (hold > 0) {
        ctx.strokeStyle = `rgba(34,141,92,${0.25 + hold * 0.55})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CX, CY, 44, 0, Math.PI * 2);
        ctx.stroke();
        if (hold > 0.6) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(CX - 16, CY + 2);
          ctx.lineTo(CX - 4, CY + 13);
          ctx.lineTo(CX + 18, CY - 12);
          ctx.stroke();
        }
      }
      label(ctx, '六块拼图 → 一张完整地图', W / 2, 16, 10, C.ink);
    };
    const t0 = performance.now();
    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} aria-label="拼图总结类比动画" />;
};

export default SummaryAna;
