import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

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
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}

const W = 244, H = 130;

export const Yolo26Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const n = 6;
      const bw = 26, bh = 44, gap = 10;
      const x0 = 24;
      // 一排书，前一半(左3本)会被“抽去加工”，后一半保持原样
      const p = t / 3.2;
      let drop = 0, sweep = 0, back = 0;
      if (p < 0.4) drop = p / 0.4;
      else if (p < 0.72) { drop = 1; sweep = (p - 0.4) / 0.32; }
      else { drop = 1; sweep = 1; back = (p - 0.72) / 0.28; }
      // 被加工的一半向下偏移，再并回
      const halfOffset = drop * 26 * (1 - back);
      drawShelfRow(ctx, 96, 14, 230);
      for (let i = 0; i < n; i++) {
        const isFirstHalf = i < n / 2;
        const x = x0 + i * (bw + gap);
        const y = isFirstHalf ? 96 + halfOffset : 96;
        const color = isFirstHalf
          ? lerpColor('#b8c9a7', C.blue, 0.5 * sweep)
          : '#b8c9a7';
        drawBook(ctx, x, y, bw, bh, color);
      }
      // 加工完成并回后打勾
      if (back >= 1) drawSceneLabel(ctx, 150, 96 + 16, '✓ 并回整排', C.green);
      // 手的示意：沿着被加工的一排扫过
      if (sweep < 1 && back === 0) {
        const hx = 24 + sweep * (3 * (bw + gap));
        drawHand(ctx, hx + bw / 2, 96 + halfOffset + 6, t, C.shelfDark);
      }
      drawSceneLabel(ctx, 14, 30, '一半送去精修', C.blue);
      drawSceneLabel(ctx, 150, 30, '一半保持原样', C.muted);
    };
    const tick = (t: number) => {
      render((t / 1000) % 3.2);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

function lerpColor(c1: string, c2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
