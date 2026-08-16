import React, { useEffect, useRef } from 'react';
import { easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;
const C = { field: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', desk: '#a98f6d', blue: '#cc785c', green: '#5db872', orange: '#e8a55a', brown: '#8a5a33', text: '#252523', muted: '#6c6a64' };

function background(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  for (let x = 16; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 16; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

function label(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = C.text;
  ctx.font = '600 15px "Segoe UI", sans-serif';
  ctx.fillText(text, 20, 28);
}

function registration(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
}

function drawChapter1(ctx: CanvasRenderingContext2D, p: number) {
  background(ctx); label(ctx, '把海报拉到大尺寸');
  ctx.strokeStyle = C.desk; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 55); ctx.lineTo(60, 220); ctx.stroke();
  for (let y = 70; y <= 210; y += 28) { ctx.beginPath(); ctx.moveTo(52, y); ctx.lineTo(68, y); ctx.stroke(); }
  ctx.setLineDash([6, 5]); ctx.strokeStyle = C.muted; ctx.strokeRect(105, 52, 355, 168); ctx.setLineDash([]);
  const e = easeOutCubic(p); const pw = 185 + 170 * e; const ph = 88 + 80 * e;
  ctx.fillStyle = C.paper; ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; ctx.fillRect(105, 52, pw, ph); ctx.strokeRect(105, 52, pw, ph);
  ctx.fillStyle = C.blue; ctx.fillRect(123, 75, pw * 0.46, 12); ctx.fillStyle = '#e6dfd8'; ctx.fillRect(123, 98, pw * 0.70, 8); ctx.fillRect(123, 114, pw * 0.55, 8);
  registration(ctx, 460, 52);
}

function drawChapter2(ctx: CanvasRenderingContext2D, p: number) {
  background(ctx); label(ctx, '压成可接入骨干的预览');
  ctx.fillStyle = C.paper; ctx.strokeStyle = C.brown; ctx.lineWidth = 2; ctx.fillRect(42, 65, 190, 135); ctx.strokeRect(42, 65, 190, 135);
  ctx.strokeStyle = C.green; ctx.lineWidth = 2.5; ctx.strokeRect(404, 92, 108, 82);
  const e = easeOutCubic(p); const x = 240 + e * 145; const scale = 1 - e * 0.45;
  ctx.setLineDash([6, 4]); ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(230, 132); ctx.lineTo(404, 132); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(x, 132); ctx.rotate(-0.32); ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.strokeRect(404, 92 + 40 * (1 - scale), 108, 82 * scale);
  registration(ctx, 512, 92);
}

function drawChapter3(ctx: CanvasRenderingContext2D, p: number) {
  background(ctx); label(ctx, '保留画布原生比例');
  ctx.fillStyle = C.paper; ctx.strokeStyle = C.desk; ctx.lineWidth = 2; ctx.fillRect(38, 70, 285, 135); ctx.strokeRect(38, 70, 285, 135);
  const e = easeOutCubic(p); const fw = 145 + 145 * e; const fh = 90 + 35 * e;
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; ctx.strokeRect(38, 70, fw, fh);
  ctx.fillStyle = C.orange; ctx.fillRect(32 + fw, 64 + fh, 13, 13);
  registration(ctx, 328, 195);
  ctx.fillStyle = '#f0eadd'; ctx.fillRect(372, 80, 150, 92);
  const parts = [34, 52, 26]; let x = 384;
  for (const n of parts) { ctx.fillStyle = n === 52 ? C.blue : '#cfc6b8'; ctx.fillRect(x, 112, n, 26); x += n + 4; }
  ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('示意批次', 414, 101);
}

export const StudioAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.maxWidth = '100%'; canvas.style.height = 'auto';
    let raf: number | null = null; let startTime = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (p: number) => {
      if (chapterId === 'chap-2') drawChapter2(ctx, p);
      else if (chapterId === 'chap-3') drawChapter3(ctx, p);
      else drawChapter1(ctx, p);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (time: number) => {
      if (!startTime) startTime = time;
      const duration = chapterId === 'chap-2' ? 2200 : chapterId === 'chap-3' ? 2300 : 2400;
      const cycle = duration + 1400;
      draw(Math.min(1, ((time - startTime) % cycle) / duration));
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (reduced) draw(1); else if (raf === null) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; startTime = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId]);
  const summary = chapterId === 'chap-2' ? '触控笔把海报预览压入绿色潜变量框。' : chapterId === 'chap-3' ? '橙色裁切框拉伸到原生画幅目标。' : '海报画布扩大并对齐绿色大尺寸标记。';
  return <div><canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} aria-label={summary} /><p className="sr-only">{summary}</p></div>;
};

export default StudioAnalogy;
