import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-toolbelt — a surveyor's tool belt where four instrument mounts light up one by
// one (the four GCM insertion points), looping. Single moving subject (the lighting
// sweep) + one static prop (the belt). 244×130 analogy scene.

const W = 244;
const H = 130;

interface State {
  t: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.66, w * 0.6, h * 0.8);
  ctx.quadraticCurveTo(w * 0.85, h * 0.9, w, h * 0.74);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const AnaToolbelt: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const mounts = [52, 98, 146, 192]; // four instrument mounts along the belt

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const beltY = 70;
      // the belt: a horizontal brown strap
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(28, beltY);
      ctx.lineTo(W - 28, beltY);
      ctx.stroke();

      // which mount is currently lit (sweeps 0..3, then all glow briefly)
      const cycle = 320;
      const phase = s.t % cycle;
      const step = Math.floor(phase / 60); // 0..4 (4 => brief all-on)
      const allOn = step >= 4;

      mounts.forEach((mx, i) => {
        const lit = allOn || i <= step - 1 || (i === step && phase % 60 > 20);
        // mount base
        ctx.fillStyle = '#fffef8';
        ctx.strokeStyle = lit ? '#7c3aed' : '#9aa7b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, beltY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // instrument dot
        ctx.fillStyle = lit ? '#7c3aed' : '#c7d0dd';
        ctx.beginPath();
        ctx.arc(mx, beltY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        if (lit) {
          const pulse = 0.4 + 0.4 * Math.sin(s.t * 0.2 + i);
          ctx.strokeStyle = `rgba(124,58,237,${0.3 + 0.4 * pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mx, beltY, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        // label
        ctx.fillStyle = '#68778f';
        ctx.font = '9px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('GCM', mx - 11, beltY + 26);
      });

      // caption
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('装好整套仪器', 18, 22);
      ctx.fillStyle = '#7c3aed';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(allOn ? '4 个记忆单元就位' : '逐个挂上', 18, 36);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaToolbelt;
