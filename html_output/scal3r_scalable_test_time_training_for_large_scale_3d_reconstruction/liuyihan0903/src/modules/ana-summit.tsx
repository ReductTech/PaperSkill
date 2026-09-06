import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-summit — a summit with a flag; a surveyor marker climbs the trail, reaches the
// top and the flag turns gold, looping. Single moving subject (the climbing marker)
// + one static prop (the summit). 244×130 analogy scene.

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
  ctx.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.6, h * 0.82);
  ctx.quadraticCurveTo(w * 0.85, h * 0.92, w, h * 0.78);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawSummit(ctx: CanvasRenderingContext2D, x: number, y: number, reached = false) {
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x, y - 26);
  ctx.lineTo(x + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = reached ? '#e0a712' : '#9aa7b8';
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 12, y - 36);
  ctx.lineTo(x, y - 32);
  ctx.closePath();
  ctx.fill();
}

export const AnaSummit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // trail from lower-left up to the summit at the upper-right
    const x0 = 26;
    const y0 = H - 18;
    const sx = 196; // summit base x
    const sy = 58; // summit base y

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // the trail
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(110, y0 - 20, sx, sy);
      ctx.stroke();

      // climbing progress loops 0..1 then brief hold at top
      const cycle = 240;
      const phase = s.t % cycle;
      const climb = clamp(phase / 170, 0, 1);
      const reached = climb >= 0.99;

      // quadratic-bezier point at t=climb
      const t = climb;
      const mx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * 110 + t * t * sx;
      const my = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 - 20) + t * t * sy;

      // summit (flag gold once reached)
      drawSummit(ctx, sx, sy, reached);

      // climbing marker (a survey stake in blue, green when it reaches the top)
      const c = reached ? '#228d5c' : '#27446e';
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx, my - 12);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(mx, my - 14, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // caption
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('谁先登顶', 16, 20);
      ctx.fillStyle = reached ? '#e0a712' : '#68778f';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(reached ? '登顶！' : '攀登中…', 16, 34);
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

export default AnaSummit;
