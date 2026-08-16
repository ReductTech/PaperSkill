import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

// Chapter 4 analogy: the router is an optical switch, not a prism.
// Experts are separate branches that already exist; the switch selects a few.
const W = 244;
const H = 130;

export const PrismAna: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      // input token beam
      ctx.strokeStyle = `rgba(33,50,74,${0.5 + pulse * 0.35})`;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, 70);
      ctx.lineTo(58, 70);
      ctx.stroke();
      // switch box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(58, 48, 34, 44);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(58, 48, 34, 44);
      label(ctx, '开关', 75, 70, 9, C.orange);
      // expert branches: several fibers, only the selected one lights up
      const branches = [
        { y: 28, color: C.blue },
        { y: 52, color: C.purple },
        { y: 70, color: C.green, active: true },
        { y: 88, color: C.blue },
        { y: 112, color: C.purple },
      ];
      branches.forEach((b, i) => {
        const active = b.active;
        ctx.strokeStyle = active ? C.green : 'rgba(104,119,143,0.28)';
        ctx.lineWidth = active ? 3 + pulse * 2 : 2;
        ctx.beginPath();
        ctx.moveTo(92, 70);
        ctx.quadraticCurveTo(130, (70 + b.y) / 2, 168, b.y);
        ctx.stroke();
        ctx.fillStyle = active ? `rgba(34,141,92,${0.5 + pulse * 0.5})` : 'rgba(104,119,143,0.3)';
        ctx.beginPath();
        ctx.arc(172, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      // selected branch continues to target
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(168, 70);
      ctx.lineTo(226, 70);
      ctx.stroke();
      ctx.fillStyle = `rgba(34,141,92,${0.5 + pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(232, 70, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, '总容量', 70, 32, 9, C.blue);
      label(ctx, '选中支路', 190, 24, 9, C.green);
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
  return <canvas ref={ref} width={W} height={H} aria-label="光路开关稀疏路由类比动画" />;
};

export default PrismAna;
