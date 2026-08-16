import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** Compact result table: other VLM / VLM3 / expert. Numbers from paper Table 1 & 2. */
const ROWS: { task: string; a: string; b: string; c: string }[] = [
  { task: '深度δ1↑', a: '0.84', b: '0.90', c: '≈齐' },
  { task: '物体Acc↑', a: '89.8', b: '91.4', c: '—' },
  { task: '对应EPE↓', a: '153', b: '15.4', c: '7.9' },
  { task: '位姿AUC↑', a: '5.4', b: '94.0', c: '94.7' },
];

const COLS = [
  { x0: 6, x1: 62 },
  { x0: 62, x1: 118 },
  { x0: 118, x1: 174 },
  { x0: 174, x1: 238 },
];
const HEADERS = ['任务', '其他VLM', 'VLM3', '专家'];
const HEADER_H = 22;
const PAD = 6;
const ROW_H = (H - PAD * 2 - HEADER_H) / ROWS.length;

function cellText(
  ctx: CanvasRenderingContext2D,
  text: string,
  col: { x0: number; x1: number },
  cy: number,
  color: string,
  size: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, (col.x0 + col.x1) / 2, cy);
  ctx.restore();
}

export const Ana10: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      const tableX = PAD;
      const tableY = PAD;
      const tableW = W - PAD * 2;
      const tableH = H - PAD * 2;

      ctx.fillStyle = '#e8eef6';
      ctx.fillRect(tableX, tableY, tableW, HEADER_H);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, tableW, tableH);

      // header row
      const headerCy = tableY + HEADER_H / 2;
      HEADERS.forEach((h, i) => {
        cellText(ctx, h, COLS[i], headerCy, C.blue, 10);
      });

      // vertical dividers
      for (let i = 1; i < 4; i++) {
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.moveTo(COLS[i].x0, tableY);
        ctx.lineTo(COLS[i].x0, tableY + tableH);
        ctx.stroke();
      }

      ROWS.forEach((r, ri) => {
        const y0 = tableY + HEADER_H + ri * ROW_H;
        const cy = y0 + ROW_H / 2;
        if (ri % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(tableX + 1, y0, tableW - 2, ROW_H);
        }
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.moveTo(tableX, y0);
        ctx.lineTo(tableX + tableW, y0);
        ctx.stroke();

        cellText(ctx, r.task, COLS[0], cy, C.text, 9);
        cellText(ctx, r.a, COLS[1], cy, C.red, 10);
        cellText(ctx, r.b, COLS[2], cy, C.green, 10);
        cellText(ctx, r.c, COLS[3], cy, C.orange, 10);
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
