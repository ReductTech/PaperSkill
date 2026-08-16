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

const W = 244, H = 130;

// 四代「减负」思路，循环高亮：省力气 → 一眼看全 → 边走边记 → 本文
const GEN = [
  { label: '轻量卷积', color: C.blue },
  { label: '自注意力', color: C.red },
  { label: 'Mamba', color: C.purple },
  { label: '本文', color: C.orange },
];

export const RwAna: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const p = (t / 4.8) % 1;
      const idx = Math.floor(p * GEN.length) % GEN.length;
      const pw = 54, ph = 32, gap = 6;
      const x0 = Math.round((W - (pw * GEN.length + gap * (GEN.length - 1))) / 2);
      const y = 26;
      // 一排「一代比一代省」的招牌
      GEN.forEach((g, i) => {
        const x = x0 + i * (pw + gap);
        const active = i === idx;
        ctx.fillStyle = active ? g.color : '#ffffff';
        rr(ctx, x, y, pw, ph, 9); ctx.fill();
        ctx.strokeStyle = active ? g.color : C.line;
        ctx.lineWidth = active ? 2.2 : 1.2; ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : C.ink;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g.label, x + pw / 2, y + ph / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      });
      // 箭头指向当前一代
      const ax = x0 + idx * (pw + gap) + pw / 2;
      const ay = y + ph + 8;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + 8); ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(ax, ay + 13); ctx.lineTo(ax - 5, ay + 4); ctx.lineTo(ax + 5, ay + 4); ctx.closePath(); ctx.fill();
      // 底部进度条
      ctx.strokeStyle = C.line; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(16, 106); ctx.lineTo(W - 16, 106); ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(16, 106); ctx.lineTo(16 + (W - 32) * p, 106); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('每一代都换更省力的走法', 16, 123);
    };
    const tick = (t: number) => {
      render((t / 1000) % 4.8);
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
