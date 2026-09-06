import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 analogy — a central radio emits ripples; three logbooks gradually converge
// to the same color/content as ripples pass, then the loop repeats.

const W = 244;
const H = 130;

// bg valley: fill + two soft hills (scaled down for the analogy card)
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
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// small field logbook; `col` fills the note area to show its current content
function drawLogbook(ctx: CanvasRenderingContext2D, x: number, y: number, col: string, w = 30, h = 38) {
  ctx.fillStyle = '#fffef8';
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = col;
  ctx.fillRect(x + 4, y + 5, w - 8, h - 10);
  ctx.strokeStyle = '#27446e';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
}

interface State {
  t: number;
}

export const AnaRadio: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const cx = W / 2;
    const cy = 40;
    // three logbooks along the lower band
    const books = [
      { x: 30, y: 72, base: '#c43f52' },
      { x: 107, y: 78, base: '#d97706' },
      { x: 184, y: 72, base: '#27446e' },
    ];
    const target = '#228d5c';

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // cycle: 0..1 convergence, then reset
      const cyc = (s.t % 240) / 240;
      const conv = clamp(cyc * 1.4, 0, 1);

      // radio ripples
      for (let i = 0; i < 3; i++) {
        const rp = ((s.t + i * 26) % 78) / 78;
        ctx.strokeStyle = `rgba(39,68,110,${0.5 * (1 - rp)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + rp * 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // central radio
      ctx.fillStyle = '#27446e';
      ctx.fillRect(cx - 10, cy - 8, 20, 16);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 8);
      ctx.lineTo(cx + 12, cy - 20);
      ctx.stroke();
      ctx.fillStyle = '#e0a712';
      ctx.beginPath();
      ctx.arc(cx + 12, cy - 20, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // logbooks converge toward the shared green content
      books.forEach((b) => {
        const col = lerpColor(b.base, target, conv);
        drawLogbook(ctx, b.x, b.y, col);
        // connecting line appears as they align
        ctx.strokeStyle = `rgba(34,141,92,${0.5 * conv})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(b.x + 15, b.y);
        ctx.stroke();
      });

      ctx.fillStyle = '#21324a';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(conv > 0.85 ? '记录本已对齐' : '正在同步…', 8, 122);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default AnaRadio;
