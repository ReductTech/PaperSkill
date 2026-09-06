import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-calibrate — a surveyor on a slope keeps adjusting stride until it matches the
// terrain: stride starts mismatched (red), then calibrates to a good fit (green),
// looping. Single moving subject (the surveyor) + one static prop (the slope).
// 244×130 analogy scene.

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
  ctx.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.88, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawSurveyor(ctx: CanvasRenderingContext2D, x: number, y: number, phase = 0, color = '#27446e') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  const s = Math.sin(phase) * 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x - 4 - s, y + 8);
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 4 + s, y + 8);
  ctx.stroke();
}

export const AnaCalibrate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // a straight slope from lower-left to upper-right
      const x0 = 30;
      const y0 = H - 22;
      const x1 = W - 30;
      const y1 = 46;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // cycle: mismatch (red) -> calibrating -> matched (green), then reset
      const cycle = 260;
      const phase = s.t % cycle;
      const fit = clamp(phase / 180, 0, 1); // 0 = mismatched, 1 = matched
      const color = lerpColor('#c43f52', '#228d5c', fit);

      // surveyor walks up the slope, position loops
      const p = (phase % cycle) / cycle;
      const wx = x0 + (x1 - x0) * (0.15 + 0.7 * p);
      const wy = y0 + (y1 - y0) * (0.15 + 0.7 * p);
      // stride swing amplitude shrinks toward a good fit (over-striding when mismatched)
      const swing = s.t * 0.35;
      const amp = 1 + (1 - fit) * 2.2;
      drawSurveyor(ctx, wx, wy - 2, swing * amp, color);

      // caption
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('按地形校准步幅', 20, 20);
      ctx.fillStyle = fit > 0.85 ? '#228d5c' : fit < 0.3 ? '#c43f52' : '#68778f';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(fit > 0.85 ? '步幅贴合' : fit < 0.3 ? '步幅失配' : '校准中…', 20, 34);
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

export default AnaCalibrate;
