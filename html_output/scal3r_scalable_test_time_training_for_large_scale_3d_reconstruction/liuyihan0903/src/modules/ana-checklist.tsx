import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-checklist — a 3-row quality checklist (相机/深度/点图). Check marks light up
// row by row in a loop; after all three are checked a green "合格" appears at the
// bottom, then the loop restarts. Single moving subject (the advancing check).
// 244×130 analogy scene.

const W = 244;
const H = 130;

interface State {
  t: number;
}

const ROWS = ['相机', '深度', '点图'];

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

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 1, y + 4);
  ctx.lineTo(x + 6, y - 5);
  ctx.stroke();
}

export const AnaChecklist: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // loop cycle: light one row every 50 frames, hold "合格" a while, then reset
      const cycle = 260;
      const phase = s.t % cycle;
      const checked = Math.min(3, Math.floor(phase / 50));
      const passed = phase >= 165;

      // clipboard panel
      const px = 26;
      const py = 20;
      const pw = 150;
      const ph = 92;
      ctx.fillStyle = '#fffef8';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      for (let i = 0; i < ROWS.length; i++) {
        const ry = py + 16 + i * 20;
        const done = i < checked;
        // checkbox
        ctx.strokeStyle = done ? '#228d5c' : '#9aa7b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 12, ry - 8, 12, 12);
        if (done) drawCheck(ctx, px + 18, ry - 2, '#228d5c');
        // label
        ctx.fillStyle = done ? '#21324a' : '#68778f';
        ctx.fillText(ROWS[i], px + 34, ry + 2);
      }

      // 合格 banner at bottom once all three checked
      if (passed) {
        const pulse = 0.6 + 0.4 * Math.sin(s.t * 0.35);
        ctx.fillStyle = `rgba(34,141,92,${0.85 + 0.15 * pulse})`;
        ctx.font = '13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('✓ 合格', W - 88, H - 14);
      }
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

export default AnaChecklist;
