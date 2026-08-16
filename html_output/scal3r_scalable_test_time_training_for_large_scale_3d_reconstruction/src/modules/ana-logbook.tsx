import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-logbook — a field logbook fills row by row with compressed marks; when a
// page fills it compresses/merges then continues, looping. Single moving subject
// (the logbook filling) + one static prop (a small stake). 244×130 analogy scene.

const W = 244;
const H = 130;

interface State {
  t: number;
}

// field logbook; fill in [0,1] draws that fraction of note-rows
function drawLogbook(ctx: CanvasRenderingContext2D, x: number, y: number, fill = 0, w = 54, h = 64) {
  ctx.fillStyle = '#fffef8';
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#27446e';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  const rows = Math.round(fill * 8);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < rows; i++) {
    const ry = y + 8 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x + 6, ry);
    ctx.lineTo(x + w / 2 - 4, ry);
    ctx.moveTo(x + w / 2 + 4, ry);
    ctx.lineTo(x + w - 6, ry);
    ctx.stroke();
  }
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
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const AnaLogbook: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // cycle: fill 8 rows, then a brief "compress/merge" flash, then continue
      const cycle = 300;
      const phase = s.t % cycle;
      const filling = clamp(phase / 220, 0, 1);
      const merging = phase > 220 && phase < 260;
      const fill = merging ? 1 : filling;

      const lx = 40;
      const ly = 34;
      const lw = 54;
      const lh = 64;
      drawLogbook(ctx, lx, ly, fill, lw, lh);

      // the freshly written compressed mark (dot/short line) on the active row
      const rows = Math.round(fill * 8);
      if (rows > 0 && !merging) {
        const ry = ly + 8 + (rows - 1) * 7;
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(lx + lw - 8, ry, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // compress/merge flash: an orange bracket pulling rows together
      if (merging) {
        const pulse = 0.5 + 0.5 * Math.sin(s.t * 0.4);
        ctx.strokeStyle = `rgba(217,119,6,${0.4 + 0.5 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx + lw + 6, ly + 10);
        ctx.lineTo(lx + lw + 12, ly + lh / 2);
        ctx.lineTo(lx + lw + 6, ly + lh - 10);
        ctx.stroke();
      }

      // incoming stream of marks flowing into the book (idle motion)
      ctx.fillStyle = '#68778f';
      for (let i = 0; i < 4; i++) {
        const p = ((s.t * 0.9 + i * 26) % 104) / 104;
        const sx = 150 - p * 44;
        const sy = ly + 18 + i * 10;
        ctx.globalAlpha = 0.35 + 0.4 * (1 - p);
        ctx.fillRect(sx, sy, 5, 2);
      }
      ctx.globalAlpha = 1;

      // caption
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('压缩记忆', 152, ly + 24);
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(merging ? '合并旧记号' : '逐行写入', 152, ly + 42);
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

export default AnaLogbook;
