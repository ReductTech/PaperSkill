import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const PERIOD = 3.0;

const CLOUDY = [1, 4, 5, 8, 10];
const CELL_X = 40;
const CELL_Y = 30;
const CELL_W = 40;
const CELL_H = 58;

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 24);
  ctx.lineTo(W, H - 24);
  ctx.stroke();
}

function drawCalendar(ctx: CanvasRenderingContext2D) {
  const totalW = CELL_W * 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(CELL_X, CELL_Y, totalW, CELL_H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.strokeRect(CELL_X, CELL_Y, totalW, CELL_H);
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) {
    const x = CELL_X + i * CELL_W;
    ctx.beginPath();
    ctx.moveTo(x, CELL_Y);
    ctx.lineTo(x, CELL_Y + CELL_H);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(184, 201, 167, 0.5)';
  for (const i of CLOUDY) {
    ctx.fillRect(CELL_X + i * CELL_W + 2, CELL_Y + 2, CELL_W - 4, CELL_H - 4);
  }
}

function drawStampMark(ctx: CanvasRenderingContext2D, cell: number, alpha: number) {
  const x = CELL_X + cell * CELL_W + 6;
  const y = CELL_Y + 7;
  const w = CELL_W - 12;
  const h = CELL_H - 14;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#27446e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + h * 0.52);
  ctx.lineTo(x + w * 0.44, y + h * 0.74);
  ctx.lineTo(x + w * 0.78, y + h * 0.26);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}

function drawCloudSticker(ctx: CanvasRenderingContext2D) {
  const cx = 508;
  const cy = 24;
  ctx.fillStyle = '#b8c9a7';
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  const blob = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  blob(cx - 10, cy + 3, 7);
  blob(cx, cy - 2, 9);
  blob(cx + 10, cy + 3, 7);
  ctx.fillStyle = '#68778f';
  ctx.beginPath();
  ctx.arc(cx, cy - 12, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStampTool(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#27446e';
  ctx.beginPath();
  ctx.arc(x, y - 27, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5, y - 24, 10, 16);
  ctx.fillRect(x - 15, y - 9, 30, 11);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 13, y - 6, 26, 4);
}

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const u = (t % PERIOD) / PERIOD;
      const pos = clamp(u * 12, 0, 11);
      const cell = clamp(Math.floor(pos), 0, 11);
      const phase = clamp(pos - cell, 0, 1);
      const fade = clamp((1 - u) / 0.08, 0, 1);

      clearScene(ctx);
      drawCalendar(ctx);

      for (let i = 0; i < 12; i++) {
        if (i < pos - 0.5 && !CLOUDY.includes(i)) drawStampMark(ctx, i, fade);
      }

      drawCloudSticker(ctx);

      const lift = Math.sin(Math.PI * phase);
      const yBase = CELL_Y + 30;
      const yOff = CLOUDY.includes(cell) ? -22 * lift : 16 * lift;
      drawStampTool(ctx, CELL_X + CELL_W / 2 + pos * CELL_W, yBase + yOff);
    };

    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
