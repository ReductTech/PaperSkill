import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 560, H = 140;
export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let t0 = performance.now();
    const render = (t: number) => {
      const u = ((t - t0) % 3200) / 3200;
      clearScene(ctx, W, H);
      drawRoad(ctx, 90, W);
      drawFlag(ctx, W - 48, 78);
      const mode: string = 'segment';
      if (mode === 'jitter') {
        const x = 40 + u * (W - 140);
        const y = 82 + Math.sin(u * Math.PI * 12) * 10;
        drawCar(ctx, x, y, C.red);
        drawLabel(ctx, '微调', 16, 28, C.red);
      } else if (mode === 'segment') {
        const segs = 4;
        const si = Math.floor(u * segs) % segs;
        const local = (u * segs) % 1;
        const x0 = 50 + si * ((W - 120) / segs);
        const x1 = 50 + (si + 1) * ((W - 120) / segs);
        const x = lerp(x0, x1, local);
        ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x0, 90); ctx.lineTo(x1, 90); ctx.stroke();
        drawCar(ctx, x, 82, C.blue);
        drawLabel(ctx, '整段', 16, 28, C.blue);
      } else if (mode === 'record') {
        const x = 60 + u * 380;
        drawCar(ctx, x, 82, C.blue);
        for (let i = 0; i < 3; i++) {
          const bx = 70 + i * 90;
          ctx.strokeStyle = i * 0.33 < u ? C.green : C.axis;
          ctx.strokeRect(bx, 28, 70, 36);
          drawLabel(ctx, '步' + (i + 1), bx + 18, 52, C.muted);
        }
      } else if (mode === 'fork') {
        ctx.strokeStyle = C.red; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, 90); ctx.quadraticCurveTo(200, 40, 360, 90); ctx.stroke();
        ctx.strokeStyle = C.green; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(360, 90); ctx.stroke();
        const x = 40 + u * 320;
        drawCar(ctx, x, 82, C.green);
        drawLabel(ctx, '对齐', 16, 28, C.green);
      } else if (mode === 'credit') {
        const steps = [0.2, 0.45, 0.7];
        steps.forEach((s, i) => {
          const x = 80 + i * 140;
          const h = 20 + Math.sin((u + i) * 4) * 8 + (i === 1 ? 24 : 0);
          ctx.fillStyle = i === 1 ? C.green : C.orange;
          ctx.fillRect(x, 70 - h, 28, h);
          drawLabel(ctx, '步' + (i + 1), x + 2, 100, C.muted);
        });
        drawCar(ctx, 80 + ((u * 3) | 0) * 140 + 14, 82, C.blue, 0.85);
      } else if (mode === 'roll') {
        const step = Math.floor(u * 3);
        const local = (u * 3) % 1;
        const x = 70 + step * 140 + local * 100;
        drawCar(ctx, x, 82, C.blue);
        drawLabel(ctx, '推进', 16, 28, C.blue);
      } else if (mode === 'train') {
        const pace = 0.3 + 0.5 * Math.sin(u * Math.PI * 2);
        const x = 60 + u * 400;
        drawCar(ctx, x, 82, pace > 0.55 ? C.green : pace < 0.4 ? C.red : C.orange);
        drawLabel(ctx, '训练', 16, 28, C.orange);
      } else if (mode === 'stack') {
        const n = 1 + Math.floor(u * 3);
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = i === n - 1 ? C.purple : C.envD;
          ctx.fillRect(200, 100 - i * 22, 120, 18);
        }
        drawCar(ctx, 120, 82, C.blue, 0.9);
        drawLabel(ctx, '结构', 16, 28, C.purple);
      } else if (mode === 'check') {
        drawCar(ctx, 200 + Math.sin(u * Math.PI * 2) * 20, 82, C.blue);
        ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
        ctx.strokeRect(320, 40, 90, 50);
        drawLabel(ctx, '检查', 340, 70, C.orange);
      } else {
        const methods = [
          { y: 40, c: C.red, s: 0.55 },
          { y: 70, c: C.orange, s: 0.7 },
          { y: 100, c: C.green, s: 1 },
        ];
        methods.forEach((m) => {
          ctx.fillStyle = C.envL; ctx.fillRect(40, m.y, 420, 10);
          ctx.fillStyle = m.c; ctx.fillRect(40, m.y, 40 + u * 380 * m.s, 10);
        });
        drawLabel(ctx, '对比', 16, 24, C.orange);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => { render(now); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default HeroNew;
