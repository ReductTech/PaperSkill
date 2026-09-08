import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Shared paper drawing kit (paste identical copies per widget; see packet-guide.md).
const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function drawShelfRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.fillStyle = C.shelf; ctx.fillRect(x0, y - 6, x1 - x0, 8);
  ctx.fillStyle = C.shelfDark; ctx.fillRect(x0, y + 1, x1 - x0, 2);
  ctx.fillStyle = 'rgba(118,144,106,0.25)'; ctx.fillRect(x1 - 4, y - 8, 4, 10);
}
function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, color: string) {
  ctx.fillStyle = color; rr(ctx, x, y - bh, bw, bh, 2); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.35)'; ctx.fillRect(x + bw / 2 - 0.5, y - bh + 3, 1, bh - 6);
}
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.sin(t * 6) * 1.2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  rr(ctx, -16, -22, 32, 24, 9); ctx.fill(); ctx.stroke();
  rr(ctx, -12, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 3, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawBookmark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill();
}
function drawEndStop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.wood;
  ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 12, y); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.fill();
}
function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  ctx.fillStyle = '#ffffff'; rr(ctx, x, y, 96, 30, 5); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + 8, y + 13);
  ctx.fillStyle = C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.fillText(value, x + 8, y + 25);
}
function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.font = 'bold 20px "Segoe UI", sans-serif'; ctx.fillText('✓', x, y);
}
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 90, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 90 + 9, y + 8);
  });
}

const W = 560, H = 200;
const SHELF_Y = 172;   // shelf board baseline (drawShelfRow draws board around this y)
const BOOK_BASE = 166; // = SHELF_Y - 6: the top surface of the board
const BOOKS = [60, 132, 204, 276, 348];
const BW = 34, BH = 52;

// Draw a curved red "comparison" connection that draws itself out by `prog` (0..1).
function drawConnection(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, prog: number) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 34;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  const len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) + 48;
  ctx.setLineDash([Math.max(1, len * prog), len]);
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
}

export const HeroContrast: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawShelfRow(ctx, SHELF_Y, 20, 540);

      // Both panels share the same static shelf row.
      for (let i = 0; i < BOOKS.length; i++) {
        drawBook(ctx, BOOKS[i], BOOK_BASE, BW, BH, i % 2 === 0 ? C.blue : C.shelf);
      }

      ctx.textAlign = 'center';

      if (!isNew) {
        // OLD method (C2PSA): a hand holds a new book and compares it with every
        // previous book — red connection lines accumulate (quadratic pairwise).
        const newX = 470;
        const newTop = 100;
        drawBook(ctx, newX, newTop + BH, BW, BH, C.blue); // the new book being held
        drawHand(ctx, newX + 2, newTop - 2, t, C.shelfDark);
        for (let i = 0; i < BOOKS.length; i++) {
          const t0 = 0.12 + i * 0.26;
          const prog = clamp((t - t0) / 0.28, 0, 1);
          if (prog <= 0) continue;
          drawConnection(ctx, newX, newTop, BOOKS[i] + BW / 2, BOOK_BASE - BH, prog);
        }
        ctx.fillStyle = C.red;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('N×N 打分 · 重', W / 2, 26);
      } else {
        // NEW method (MambaPSA): one hand sweeps left→right once with a bookmark
        // (memory), leaving a green/blue path behind — linear scan.
        const sweepP = easeInOutQuad(clamp(t / 1.5, 0, 1));
        const handX = lerp(36, 524, sweepP);
        const pathY = BOOK_BASE - BH - 6; // just above the book tops
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(36, pathY);
        ctx.lineTo(handX, pathY);
        ctx.stroke();
        drawBookmark(ctx, handX, pathY - 16, C.wood); // memory bookmark
        drawHand(ctx, handX, pathY - 6, t, C.shelfDark);
        if (sweepP >= 1) {
          const a = clamp((t - 1.5) / 0.3, 0, 1);
          ctx.globalAlpha = a;
          drawTargetMark(ctx, 538, pathY - 12, C.green);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = C.green;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('线性扫描 · 轻', W / 2, 26);
      }

      ctx.textAlign = 'left';
    };

    const tick = (t: number) => {
      render((t / 1000) % 2.4); // loop period ~2.4s, both sides in sync
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
  }, [isNew]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
